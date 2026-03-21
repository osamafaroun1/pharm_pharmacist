import { IconPhone_PharmProfile, IconPin_PharmProfile } from '../Icons';

interface Props {
    user: any;
}

export default function ProfileHeader({ user }: Props) {
    return (
        <div className="profile-header" style={{ marginBottom: 20 }}>
            <div className="profile-av">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div>
                <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                <div className="profile-pharmacy" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                    </svg>
                    {user?.pharmacyName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconPhone_PharmProfile /> {user?.phone}
                    {user?.landline && (
                        <>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <IconPhone_PharmProfile /> {user.landline}
                        </>
                    )}
                </div>
                {user?.pharmacyLocation && (
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconPin_PharmProfile /> {user.pharmacyLocation}
                    </div>
                )}
            </div>
        </div>
    );
}