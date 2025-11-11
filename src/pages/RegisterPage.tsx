import { RegisterForm } from '@medplum/react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { MEDPLUM_GOOGLE_CLIENT_ID, MEDPLUM_PROJECT_ID, MEDPLUM_RECAPTCHA_SITE_KEY } from '../config';
export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div id="signin" className="flex h-screen flex-col justify-between">
      <main>
        <div className="relative bg-white">
          <div className="lg:absolute lg:inset-0">
            <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
              <img
                className="h-56 w-full object-cover lg:absolute lg:h-full"
                src="src/img/8_pasos_AHA_Cardio.jpg"
                alt="8 Pasos"
              />
            </div>
          </div>
          <div className="relative py-4 px-4 sm:px-6 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2 lg:px-8">
            <div className="flex flex-col justify-between lg:pr-8">
              <RegisterForm
                type="patient"
                projectId={MEDPLUM_PROJECT_ID}
                googleClientId={MEDPLUM_GOOGLE_CLIENT_ID}
                recaptchaSiteKey={MEDPLUM_RECAPTCHA_SITE_KEY}
                onSuccess={() => navigate('/')}
              >
                <h2>REGISTRO</h2>
              </RegisterForm>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
