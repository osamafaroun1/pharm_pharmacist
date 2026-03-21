import { IconUser_PharmProfile, IconPharmacy_PharmProfile, IconLock_PharmProfile } from '../Icons';

interface Props {
    tab: 'info' | 'pharmacy' | 'security';
    setTab: (tab: any) => void;
    TABS: any[];
}

export default function ProfileTabs({ tab, setTab, TABS }: Props) {
    return (
        <div style={{ 
            display: 'flex', gap: 4, background: 'var(--bdr2)', 
            borderRadius: 'var(--r2)', padding: 4, marginBottom: 20 
        }}>
            {TABS.map(({ id, label, Icon }) => (
                <button 
                    key={id}
                    style={{ 
                        flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 13, 
                        fontWeight: 700, border: 'none', cursor: 'pointer', 
                        transition: 'all .2s', 
                        background: tab === id ? 'white' : 'transparent', 
                        color: tab === id ? 'var(--p)' : 'var(--tx2)', 
                        boxShadow: tab === id ? 'var(--sh0)' : 'none', 
                        display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', gap: 5 
                    }}
                    onClick={() => setTab(id)}
                >
                    <Icon /> {label}
                </button>
            ))}
        </div>
    );
}