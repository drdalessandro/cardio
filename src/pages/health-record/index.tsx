import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { measurementsMeta } from './Measurement';

const MainResult = lazy(() => import('./MainResult'));
const Vitals = lazy(() => import('./Vitals'));
const Measurement = lazy(() => import('./Measurement'));

export const sideMenu = {
  title: 'Datos de Salud',
  menu: [
    
    { name: 'Vitales',
      href: '/health-record/vitals',
      subMenu: Object.values(measurementsMeta).map(({ title, id }) => ({
        name: title,
        href: `/health-record/vitals/${id}`,
      })),
        },
  ],
};

export default function HealthRecord(): JSX.Element {
  return (
    <PageLayout sideMenu={sideMenu}>
      <Routes>
        <Route index element={<Navigate replace to={sideMenu.menu[0].href} />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="vitals/:measurementId" element={<Measurement />} />
      </Routes>
    </PageLayout>
  );
}
