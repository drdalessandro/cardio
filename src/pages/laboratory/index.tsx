import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { labMeasurementsMeta } from '../health-record/LabMeasurement';

const LabResults = lazy(() => import('../health-record/LabResults'));
const MainResult = lazy(() => import('../health-record/MainResult'));
const LabMeasurement = lazy(() => import('../health-record/LabMeasurement'));

export const sideMenu = {
  title: 'Laboratorio',
  menu: [
    ...Object.values(labMeasurementsMeta).map(({ title, id }) => ({
      name: title,
      href: `/laboratory/measure/${id}`,
    })),
    {
      name: '📋 Resultados de Estudios',
      href: '/laboratory/reports'
    },
  ],
};

export default function Laboratory(): JSX.Element {
  return (
    <PageLayout sideMenu={sideMenu}>
      <Routes>
        <Route index element={<Navigate replace to="/laboratory/reports" />} />

        {/* Mediciones de Laboratorio */}
               <Route path="measure/:measurementId" element={<LabMeasurement />} />

        {/* Resultados de Estudios */}
        <Route path="reports" element={<LabResults />} />
        <Route path="reports/:resultId" element={<MainResult />} />
      </Routes>
    </PageLayout>
  );
}
