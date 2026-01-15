// CREAR NUEVO ARCHIVO: src/pages/health-record/LabMeasurement.tsx

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { createReference, getReferenceString } from '@medplum/core';
import { BundleEntry, Observation, Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../../components/Button';
import InfoSection from '../../components/InfoSection';
import LinkToPreviousPage from '../../components/LinkToPreviousPage';
import MeasurementModal from '../../components/MeasurementModal';
import getLocaleDate from '../../helpers/get-locale-date';
import renderValue from '../../helpers/get-render-value';
import NoData from '../../components/NoData';

const LineChart = React.lazy(() => import('../../components/LineChart'));

interface labMeasurementsMetaType {
  [key: string]: {
    id: string;
    code: string;
    title: string;
    description: string;
    chartDatasets: {
      label: string;
      backgroundColor: string;
      borderColor: string;
    }[];
  };
}

interface chartDataType {
  labels: (string | null | undefined)[];
  datasets: {
    label: string;
    data: (number | undefined)[];
    backgroundColor: string;
    borderColor?: string;
  }[];
}

export const backgroundColor = 'rgba(220, 38, 38, 0.7)'; // Red
export const borderColor = 'rgba(220, 38, 38, 1)';
export const secondBackgroundColor = 'rgba(251, 146, 60, 0.7)'; // Orange
export const secondBorderColor = 'rgba(251, 146, 60, 1)';

export const labMeasurementsMeta: labMeasurementsMetaType = {
  'total-cholesterol': {
    id: 'total-cholesterol',
    code: '2093-3',
    title: 'Colesterol Total',
    description: 'El colesterol total indica la cantidad total de colesterol en sangre. Valor óptimo: <200 mg/dL. Valores de 200-239 mg/dL son limítrofes y ≥240 mg/dL son altos. El colesterol es una sustancia cerosa que el cuerpo necesita para producir células sanas, pero niveles altos aumentan el riesgo de enfermedad cardíaca.',
    chartDatasets: [{
      label: 'Colesterol Total',
      backgroundColor,
      borderColor,
    }],
  },
  
  'ldl-cholesterol': {
    id: 'ldl-cholesterol',
    code: '18262-6',
    title: 'LDL Colesterol (Malo)',
    description: 'El colesterol LDL es conocido como "colesterol malo" porque puede acumularse en las paredes de las arterias. Valor óptimo: <100 mg/dL. Valores de 100-159 mg/dL son limítrofes y ≥160 mg/dL son altos. Reducir el LDL es clave para prevenir enfermedades cardiovasculares.',
    chartDatasets: [{
      label: 'LDL',
      backgroundColor: secondBackgroundColor,
      borderColor: secondBorderColor,
    }],
  },
  
  'hdl-cholesterol': {
    id: 'hdl-cholesterol',
    code: '2085-9',
    title: 'HDL Colesterol (Bueno)',
    description: 'El colesterol HDL es conocido como "colesterol bueno" porque ayuda a eliminar el colesterol de las arterias. Valor deseable: ≥60 mg/dL. Valores de 40-59 mg/dL son aceptables y <40 mg/dL son bajos. Niveles altos de HDL protegen contra enfermedades cardíacas.',
    chartDatasets: [{
      label: 'HDL',
      backgroundColor,
      borderColor,
    }],
  },
  
  'triglycerides': {
    id: 'triglycerides',
    code: '2571-8',
    title: 'Triglicéridos',
    description: 'Los triglicéridos son un tipo de grasa en la sangre que el cuerpo usa como energía. Valor normal: <150 mg/dL. Valores de 150-199 mg/dL son limítrofes altos, 200-499 mg/dL son altos y ≥500 mg/dL son muy altos. Niveles elevados aumentan el riesgo de pancreatitis y enfermedad cardíaca.',
    chartDatasets: [{
      label: 'Triglicéridos',
      backgroundColor,
      borderColor,
    }],
  },
  
  'fasting-glucose': {
    id: 'fasting-glucose',
    code: '1558-6',
    title: 'Glucosa en Ayunas',
    description: 'La glucosa en ayunas mide el nivel de azúcar en sangre después de 8 horas de ayuno. Valor normal: <100 mg/dL. Valores de 100-125 mg/dL indican prediabetes y ≥126 mg/dL indican diabetes. Es fundamental para detectar diabetes tipo 2 de manera temprana.',
    chartDatasets: [{
      label: 'Glucosa Ayunas',
      backgroundColor,
      borderColor,
    }],
  },
  
  'hba1c': {
    id: 'hba1c',
    code: '4548-4',
    title: 'Hemoglobina A1c',
    description: 'La HbA1c refleja el promedio de glucosa en los últimos 2-3 meses. Valor normal: <5.7%. Valores de 5.7-6.4% indican prediabetes y ≥6.5% indican diabetes. Es el mejor indicador para monitorear el control de la diabetes a largo plazo.',
    chartDatasets: [{
      label: 'HbA1c',
      backgroundColor,
      borderColor,
    }],
  },
};

const LabMeasurement = (): JSX.Element | null => {
  const { measurementId } = useParams();
  const measurement = labMeasurementsMeta[measurementId as string];
  
  if (!measurement) {
    return null;
  }
  
  const { code, title, description, chartDatasets } = measurement;
  const medplum = useMedplum();
  const patient = medplum.getProfile() as Patient;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<chartDataType>();
  const measurements = medplum.search('Observation', `code=${code}&patient=${getReferenceString(patient)}`).read();
  
  useEffect(() => {
    if (measurements.entry) {
      const labels = measurements.entry.map(({ resource }) => {
        if (resource?.effectiveDateTime) {
          return getLocaleDate(resource?.effectiveDateTime);
        }
      });
      setChartData({
        labels,
        datasets: chartDatasets.map((item, i) => ({
          ...item,
          data: getDatasets(i, measurements.entry),
        })),
      });
    }
  }, [chartDatasets, measurements]);

  const getDatasets = (index: number, measurements?: BundleEntry<Observation>[]): (number | undefined)[] => {
    if (measurements) {
      return measurements.map(({ resource }) =>
        resource?.component?.length ? resource?.component[index].valueQuantity?.value : resource?.valueQuantity?.value
      );
    }
    return [];
  };

  const handleAddMeasurement = (): void => {
    setIsModalOpen(true);
  };

  return (
    <>
      <LinkToPreviousPage url="/laboratory/reports" label="Laboratorio" />
      <div className="mt-5 flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <Button marginsUtils="ml-0" label="Agregar Medición" action={handleAddMeasurement} />
      </div>
      {chartData && (
        <Suspense fallback={null}>
          <LineChart chartData={chartData} />
        </Suspense>
      )}
      {description && (
        <div className="mb-10 overflow-hidden border bg-white p-4 sm:rounded-md">
          <div className="mb-3 flex items-center text-gray-600">
            <InformationCircleIcon className="mr-2 h-6 w-6 flex-shrink-0" />
            <h3 className="text-lg font-bold">¿Qué estamos midiendo?</h3>
          </div>
          <p className="text-base text-gray-600">{description}</p>
        </div>
      )}
      {measurements.entry?.length ? (
        <InfoSection
          title={
            <div className="flex justify-between">
              <p>Mediciones</p>
              <p>Valores</p>
            </div>
          }
        >
          <div className="px-4 pt-4 pb-2">
            {measurements.entry &&
              [...measurements.entry].reverse().map(({ resource }) => {
                if (!resource) return null;
                const time = getLocaleDate(resource.effectiveDateTime, true);
                return (
                  <div className="mb-2 flex justify-between" key={resource.id}>
                    {time && <p>{time}</p>}
                    {renderValue(resource)}
                  </div>
                );
              })}
          </div>
        </InfoSection>
      ) : (
        <NoData title="Mediciones" />
      )}
      <MeasurementModal
        subject={createReference(patient)}
        type={title}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(!isModalOpen)}
      />
    </>
  );
};

export default LabMeasurement;
