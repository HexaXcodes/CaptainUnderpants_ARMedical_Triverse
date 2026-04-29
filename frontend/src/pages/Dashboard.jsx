// src/pages/Dashboard.jsx
import { Link } from 'react-router-dom';
import { Activity, Heart, Pill, AlertCircle, ScanLine, FileText, ArrowRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/common/Card';
import StatTile from '../components/dashboard/StatTile';
import MedicalInfoForm from '../components/dashboard/MedicalInfoForm';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, updateMedicalInfo } = useAuth();
  const med = user?.medicalInfo || {};

  return (
    <PageShell>
      {/* Hero strip */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="label-display mb-2">Dashboard</p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl leading-[0.95]">
            Hello, <span className="text-primary">{user?.name?.split(' ')[0] || 'there'}</span>.
          </h1>
          <p className="text-ink/70 mt-2">
            Update your medical profile so the AI can tailor every step.
          </p>
        </div>
        <Link to="/workflow" className="btn-primary">
          <ScanLine size={18} strokeWidth={2.5} />
          Launch Scenarios
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Conditions" value={med.conditions?.length || 0} icon={Activity} />
        <StatTile label="Medications" value={med.medications?.length || 0} icon={Pill} accent="accent" />
        <StatTile label="Allergies" value={med.allergies?.length || 0} icon={AlertCircle} />
        <StatTile label="Reports" value={user?.reports?.length || 0} icon={FileText} accent="accent" />
      </div>

      {/* Two-column main */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="label-display">Medical Profile</p>
                <h2 className="font-display font-bold text-2xl">Your patient context</h2>
              </div>
              <Heart className="text-primary" size={24} strokeWidth={2.5} />
            </div>
            <MedicalInfoForm initial={med} onSave={updateMedicalInfo} />
          </Card>
        </div>

        <div className="space-y-5">
          {/* Quick links */}
          <Card>
            <p className="label-display mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link
                to="/workflow"
                className="flex items-center justify-between p-3 bg-white/60 border-2 border-ink rounded-lg hover:bg-primary hover:text-white transition group"
              >
                <span className="font-display font-semibold">Open AR Scenarios</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
              </Link>
              <Link
                to="/upload"
                className="flex items-center justify-between p-3 bg-white/60 border-2 border-ink rounded-lg hover:bg-primary hover:text-white transition group"
              >
                <span className="font-display font-semibold">Upload Reports</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </Card>

          {/* Latest reports */}
          <Card>
            <p className="label-display mb-3">Recent Reports</p>
            {user?.reports?.length ? (
              <ul className="space-y-2">
                {user.reports.slice(-3).reverse().map((r) => (
                  <li key={r._id || r.filename} className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-primary" />
                    <span className="truncate">{r.originalName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-xs text-ink/60">No reports uploaded yet.</p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
