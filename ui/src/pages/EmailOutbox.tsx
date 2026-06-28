import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
    IconButton, List, ListItem, ListItemButton, ListItemText, Paper, Tab, Tabs, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import OutboxIcon from '@mui/icons-material/Outbox';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';

export interface EmailRecordSummary {
    id: number;
    recipients: string[];
    subject: string;
    body: string;
    scheduledSendTime: string | null;
    createdAt: string;
    updatedAt: string;
    sent: boolean;
    dispatched: boolean;
    editable: boolean;
}

type OutboxTab = 'sent' | 'scheduled';

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function EmailOutbox() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState<OutboxTab>('sent');
    const [emails, setEmails] = useState<EmailRecordSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setTab(searchParams.get('tab') === 'scheduled' ? 'scheduled' : 'sent');
    }, [searchParams]);

    useEffect(() => {
        const fetchEmails = async () => {
            setLoading(true);
            setError('');
            try {
                const endpoint = tab === 'sent' ? '/api/emails/sent' : '/api/emails/scheduled';
                const response = await api.get<EmailRecordSummary[]>(endpoint);
                setEmails(response.data);
            } catch (err: unknown) {
                console.error(err);
                const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
                setError(apiErr.response?.data?.message ?? apiErr.message ?? 'Could not load emails.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [tab]);

    const handleTabChange = (_: React.SyntheticEvent, value: OutboxTab) => {
        setTab(value);
        setSearchParams(value === 'scheduled' ? { tab: 'scheduled' } : {});
    };

    const emptyMessage = tab === 'sent'
        ? 'You have not sent any emails yet.'
        : 'You have no scheduled emails.';

    return (
        <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <IconButton onClick={() => navigate('/email')} sx={{ bgcolor: '#f0f0f0' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Avatar sx={{ bgcolor: tab === 'sent' ? '#2e7d32' : '#ed6c02' }}>
                    {tab === 'sent' ? <SendIcon /> : <ScheduleIcon />}
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', flexGrow: 1 }}>
                    {tab === 'sent' ? 'Sent Emails' : 'Scheduled Emails'}
                </Typography>
                <Button component={RouterLink} to="/emails/send" variant="contained" startIcon={<EditIcon />}>
                    Compose
                </Button>
            </Box>

            <Paper sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden', mb: 3 }}>
                <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
                    <Tab icon={<OutboxIcon />} iconPosition="start" label="Sent" value="sent" />
                    <Tab icon={<ScheduleIcon />} iconPosition="start" label="Scheduled" value="scheduled" />
                </Tabs>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && <Alert severity="error" variant="filled">{error}</Alert>}

            {!loading && !error && (
                <Paper sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                    {emails.length === 0 ? (
                        <Typography sx={{ p: 4, textAlign: 'center', color: '#7f8c8d' }}>
                            {emptyMessage}
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {emails.map((email, index) => (
                                <React.Fragment key={email.id}>
                                    <ListItem
                                        disablePadding
                                        secondaryAction={
                                            email.editable ? (
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => navigate(`/emails/scheduled/${email.id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                            ) : null
                                        }
                                    >
                                        <ListItemButton
                                            sx={{ p: 2, pr: email.editable ? 10 : 2 }}
                                            onClick={() => {
                                                if (email.editable) {
                                                    navigate(`/emails/scheduled/${email.id}/edit`);
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                            {email.subject || '(No Subject)'}
                                                        </Typography>
                                                        {tab === 'scheduled' && (
                                                            <Chip
                                                                size="small"
                                                                label={email.dispatched ? 'Queued' : 'Pending'}
                                                                color={email.dispatched ? 'info' : 'warning'}
                                                            />
                                                        )}
                                                        {tab === 'sent' && (
                                                            <Chip size="small" label="Sent" color="success" />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" sx={{ display: 'block', color: '#34495e' }}>
                                                            To: {email.recipients?.join(', ') || '—'}
                                                        </Typography>
                                                        <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                                            {tab === 'scheduled'
                                                                ? `Scheduled: ${formatDateTime(email.scheduledSendTime)}`
                                                                : `Sent: ${formatDateTime(email.updatedAt)}`}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < emails.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            )}
        </Box>
    );
}
