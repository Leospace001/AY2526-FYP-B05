import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { formatHongKongDateTime } from '../utils/hongKongTime';
import { htmlToPlainPreview, looksLikeOidBody } from '../utils/emailTextPreview';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
    IconButton, List, ListItem, ListItemButton, ListItemText, Paper, Tab, Tabs, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import OutboxIcon from '@mui/icons-material/Outbox';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
    attachmentPaths?: string[];
    timeZone?: string;
}

type OutboxTab = 'sent' | 'scheduled';

export default function EmailOutbox() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState<OutboxTab>('sent');
    const [emails, setEmails] = useState<EmailRecordSummary[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailRecordSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setTab(searchParams.get('tab') === 'scheduled' ? 'scheduled' : 'sent');
    }, [searchParams]);

    useEffect(() => {
        setSelectedEmail(null);
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

    if (selectedEmail) {
        const attachmentCount = selectedEmail.attachmentPaths?.length ?? 0;
        const bodyLooksBroken = looksLikeOidBody(selectedEmail.body);

        return (
            <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <IconButton onClick={() => setSelectedEmail(null)} sx={{ bgcolor: '#f0f0f0' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50', flexGrow: 1 }}>
                        {selectedEmail.subject || '(No Subject)'}
                    </Typography>
                    {selectedEmail.editable && (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/emails/scheduled/${selectedEmail.id}/edit`)}
                        >
                            Edit
                        </Button>
                    )}
                </Box>

                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>To:</strong> {selectedEmail.recipients?.join(', ') || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Created:</strong> {formatHongKongDateTime(selectedEmail.createdAt)}
                    </Typography>
                    {tab === 'scheduled' ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Scheduled:</strong> {formatHongKongDateTime(selectedEmail.scheduledSendTime)}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Sent:</strong> {formatHongKongDateTime(selectedEmail.updatedAt)}
                        </Typography>
                    )}
                    {attachmentCount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <AttachFileIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {attachmentCount} attachment{attachmentCount === 1 ? '' : 's'}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {selectedEmail.sent && <Chip size="small" label="Sent" color="success" />}
                        {tab === 'scheduled' && (
                            <Chip
                                size="small"
                                label={selectedEmail.dispatched ? 'Queued' : 'Pending'}
                                color={selectedEmail.dispatched ? 'info' : 'warning'}
                            />
                        )}
                    </Box>
                </Paper>

                {bodyLooksBroken && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This email body was saved incorrectly before a recent fix. Please compose and send it again.
                    </Alert>
                )}

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        bgcolor: '#ffffff',
                        borderRadius: 3,
                        minHeight: '280px',
                        overflowX: 'auto',
                        '& img': { maxWidth: '100%', height: 'auto' },
                    }}
                >
                    {selectedEmail.body && !bodyLooksBroken ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                    ) : (
                        <Typography sx={{ color: 'gray', fontStyle: 'italic' }}>
                            {bodyLooksBroken ? 'Body content is unavailable for this older record.' : 'This email has no body content.'}
                        </Typography>
                    )}
                </Paper>
            </Box>
        );
    }

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
                            {emails.map((email, index) => {
                                const preview = htmlToPlainPreview(email.body);
                                const attachmentCount = email.attachmentPaths?.length ?? 0;

                                return (
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
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => setSelectedEmail(email)}
                                                    >
                                                        View
                                                    </Button>
                                                )
                                            }
                                        >
                                            <ListItemButton
                                                sx={{ p: 2, pr: 12 }}
                                                onClick={() => setSelectedEmail(email)}
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
                                                            {preview && (
                                                                <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                                                    {preview}
                                                                </Typography>
                                                            )}
                                                            <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                                                {tab === 'scheduled'
                                                                    ? `Scheduled: ${formatHongKongDateTime(email.scheduledSendTime)}`
                                                                    : `Sent: ${formatHongKongDateTime(email.updatedAt)}`}
                                                                {attachmentCount > 0 ? ` · ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}` : ''}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                        {index < emails.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </Paper>
            )}
        </Box>
    );
}
