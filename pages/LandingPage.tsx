import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const demoUsers = [
    { role: 'Administrador', user: 'admin', pass: '123', desc: 'Acceso total: métricas, configuración y gestión global.' },
    { role: 'Profesional', user: '5551001', pass: '123', desc: 'Vista limitada a su propia agenda y pacientes.' },
    { role: 'Cliente', user: '5512345678', pass: '123', desc: 'Portal para ver historial y agendar nuevas citas.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Gestiona tu agenda con Inteligencia Artificial
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              CitaPlanner moderniza tu consultorio o negocio. Convierte mensajes de texto en citas organizadas, gestiona clientes y automatiza recordatorios.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/login"
                className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Iniciar Sesión
              </Link>
              <Link to="/book" className="text-sm font-semibold leading-6 text-white hover:text-indigo-300">
                Reserva una cita pública <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Credentials Section */}
      <div className="py-16 bg-indigo-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Prueba la Demo Interactiva</h2>
            <p className="text-slate-600 mt-2">Utiliza las siguientes credenciales para explorar los diferentes roles del sistema.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoUsers.map((u, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    {u.role === 'Administrador' ? <ShieldCheck size={20} /> : u.role === 'Profesional' ? <Zap size={20} /> : <Users size={20} />}
                  </div>
                  <h3 className="font-bold text-slate-800">{u.role}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4 h-10">{u.desc}</p>
                <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Usuario/Tel:</span>
                    <span className="font-mono font-bold text-slate-800">{u.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contraseña:</span>
                    <span className="font-mono font-bold text-slate-800">{u.pass}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Todo en uno</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Todo lo que necesitas para gestionar tus citas
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <CalendarDays className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Agendamiento Inteligente
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">Escribe "Cita con Juan mañana a las 5" y nuestra IA configurará todo por ti, detectando cliente, fecha y hora.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <Users className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Portal de Clientes
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">Tus clientes pueden iniciar sesión, ver su historial y agendar nuevas citas sin llamarte.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <ShieldCheck className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Roles y Seguridad
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">Acceso diferenciado para administradores, profesionales y recepcionistas. Datos seguros y organizados.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};