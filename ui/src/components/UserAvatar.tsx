import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, CircularProgress } from '@mui/material';
import api from '../api/axiosConfig';

interface UserAvatarProps {
    avatarPath?: string | null;
    avatarUrl?: string | null;
    name?: string;
    size?: number;
}

function buildInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export default function UserAvatar({ avatarPath, avatarUrl, name, size = 96 }: UserAvatarProps) {
    const [uploadedSrc, setUploadedSrc] = useState('');
    const [loading, setLoading] = useState(false);

    const externalSrc = useMemo(() => {
        if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
            return avatarUrl;
        }
        return '';
    }, [avatarUrl]);

    useEffect(() => {
        if (!avatarPath) {
            setUploadedSrc('');
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchAvatar = async () => {
            setLoading(true);
            try {
                const fileName = avatarPath.includes('/')
                    ? avatarPath.substring(avatarPath.lastIndexOf('/') + 1)
                    : avatarPath;
                const response = await api.get(`/api/admin/image/${fileName}`, { responseType: 'blob' });
                if (!cancelled) {
                    setUploadedSrc(URL.createObjectURL(response.data));
                }
            } catch {
                if (!cancelled) {
                    setUploadedSrc('');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAvatar();
        return () => {
            cancelled = true;
            if (uploadedSrc && uploadedSrc.startsWith('blob:')) {
                URL.revokeObjectURL(uploadedSrc);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avatarPath]);

    if (loading && avatarPath && !externalSrc) {
        return (
            <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={size / 3} />
            </Box>
        );
    }

    const src = uploadedSrc || externalSrc;

    return (
        <Avatar
            src={src || undefined}
            alt={name || 'User avatar'}
            sx={{ width: size, height: size, fontSize: size / 2.8, bgcolor: '#3498db' }}
        >
            {!src ? buildInitials(name) : null}
        </Avatar>
    );
}
