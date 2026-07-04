import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { formatHongKongDateTime } from '../utils/hongKongTime';
import { htmlToPlainPreview, looksLikeOidBody } from '../utils/emailTextPreview';
import { toComposeDraft } from '../utils/emailCompose';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress,
    IconButton, Paper, Tab, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, TableSortLabel, Tabs, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
    senderName?: string | null;
    createdByUsername?: string | null;
    templateKey?: string | null;
    templateDisplayName?: string | null;
    timeZone?: string;
}

type OutboxTab = 'sent' | 'scheduled';
type SortField = 'datetime' | 'to' | 'subject' | 'status';
type SortDirection = 'asc' | 'desc';

function sentAt(email: EmailRecordSummary): string | null {
    return email.updatedAt ?? email.createdAt ?? null;
}

function formatRecipients(values: string[] | undefined): string {
    if (!values || values.length === 0) {
        return '—';
    }
    return values.join(', ');
}

function formatSender(name: string | null | undefined): string {
    return name && name.trim() ? name : '—';
}

function compareStrings(a: string, b: string): number {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function compareDates(a: string | null | undefined, b: string | null | undefined): number {
    const timeA = a ? new Date(a).getTime() : 0;
    const timeB = b ? new Date(b).getTime() : 0;
    return timeA - timeB;
}

function rowDateTime(email: EmailRecordSummary, tab: OutboxTab): string | null {
    return tab === 'scheduled' ? email.scheduledSendTime : sentAt(email);
}

function statusLabel(email: EmailRecordSummary, tab: OutboxTab): string {
    if (tab === 'sent') {
        return 'Sent';
    }
    return email.dispatched ? 'Queued' : 'Pending';
}

export default function EmailOutbox() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState<OutboxTab>('sent');
    const [emails, setEmails] = useState<EmailRecordSummary[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailRecordSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortField, setSortField] = useState<SortField>('datetime');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setTab(searchParams.get('tab') === 'scheduled' ? 'scheduled' : 'sent');
    }, [searchParams]);

    useEffect(() => {
        setSelectedEmail(null);
        setPage(0);
        setSortField('datetime');
        setSortDirection(searchParams.get('tab') === 'scheduled' ? 'asc' : 'desc');

        const fetchEmails = async () => {
            setLoading(true);
            setError('');
            try {
                const currentTab = searchParams.get('tab') === 'scheduled' ? 'scheduled' : 'sent';
                const endpoint = currentTab === 'sent' ? '/api/emails/sent' : '/api/emails/scheduled';
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
    }, [searchParams]);

    const handleTabChange = (_: SyntheticEvent, value: OutboxTab) => {
        setTab(value);
        setSearchParams(value === 'scheduled' ? { tab: 'scheduled' } : {});
    };

    const handleCopyAsNewEmail = (email: EmailRecordSummary) => {
        navigate('/emails/send', {
            state: {
                draft: toComposeDraft(email),
                copySourceLabel: `Copied from "${email.subject || 'sent email'}". Edit recipients, subject, body, and attachments before sending.`,
            },
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'datetime' && tab === 'scheduled' ? 'asc' : 'desc');
        }
    };

    const sortedEmails = useMemo(() => {
        const sorted = [...emails];
        sorted.sort((a, b) => {
            let result = 0;
            switch (sortField) {
                case 'datetime':
                    result = compareDates(rowDateTime(a, tab), rowDateTime(b, tab));
                    break;
                case 'to':
                    result = compareStrings(formatRecipients(a.recipients), formatRecipients(b.recipients));
                    break;
                case 'subject':
                    result = compareStrings(a.subject ?? '', b.subject ?? '');
                    break;
                case 'status':
                    result = compareStrings(statusLabel(a, tab), statusLabel(b, tab));
                    break;
                default:
                    result = 0;
            }
            return sortDirection === 'asc' ? result : -result;
        });
        return sorted;
    }, [emails, sortDirection, sortField, tab]);

    const paginatedEmails = useMemo(
        () => sortedEmails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage, sortedEmails],
    );

    const emptyMessage = tab === 'sent'
        ? 'You have not sent any emails yet.'
        : 'You have no scheduled emails.';

    const dateColumnLabel = tab === 'scheduled' ? 'Scheduled (HKT)' : 'Sent (HKT)';

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
                    {tab === 'sent' && (
                        <Button
                            variant="contained"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => handleCopyAsNewEmail(selectedEmail)}
                        >
                            Copy as new email
                        </Button>
                    )}
                </Box>

                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>From:</strong> {formatSender(selectedEmail.senderName)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Created by:</strong> {formatSender(selectedEmail.createdByUsername)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>To:</strong> {formatRecipients(selectedEmail.recipients)}
                    </Typography>
                    {selectedEmail.templateDisplayName && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Template:</strong> {selectedEmail.templateDisplayName}
                        </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Created:</strong> {formatHongKongDateTime(selectedEmail.createdAt)}
                    </Typography>
                    {tab === 'scheduled' ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Scheduled:</strong> {formatHongKongDateTime(selectedEmail.scheduledSendTime)}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Sent:</strong> {formatHongKongDateTime(sentAt(selectedEmail))}
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
        <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
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

            {error && <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sortDirection={sortField === 'datetime' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'datetime'}
                                        direction={sortField === 'datetime' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('datetime')}
                                    >
                                        {dateColumnLabel}
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>Created by</TableCell>
                                <TableCell sortDirection={sortField === 'to' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'to'}
                                        direction={sortField === 'to' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('to')}
                                    >
                                        To
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'subject' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'subject'}
                                        direction={sortField === 'subject' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('subject')}
                                    >
                                        Subject
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Template</TableCell>
                                <TableCell sortDirection={sortField === 'status' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'status'}
                                        direction={sortField === 'status' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('status')}
                                    >
                                        Status
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedEmails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#7f8c8d' }}>
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedEmails.map((email) => {
                                    const preview = htmlToPlainPreview(email.body);
                                    const attachmentCount = email.attachmentPaths?.length ?? 0;

                                    return (
                                        <TableRow
                                            key={email.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedEmail(email)}
                                        >
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {formatHongKongDateTime(rowDateTime(email, tab))}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 120, wordBreak: 'break-word' }}>
                                                {formatSender(email.senderName)}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 120, wordBreak: 'break-word' }}>
                                                {formatSender(email.createdByUsername)}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
                                                {formatRecipients(email.recipients)}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 320, wordBreak: 'break-word' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                    {email.subject || '(No Subject)'}
                                                </Typography>
                                                {preview && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {preview}
                                                    </Typography>
                                                )}
                                                {attachmentCount > 0 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {attachmentCount} attachment{attachmentCount === 1 ? '' : 's'}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 160, wordBreak: 'break-word' }}>
                                                {email.templateDisplayName ? (
                                                    <Chip size="small" label={email.templateDisplayName} variant="outlined" />
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tab === 'sent' ? (
                                                    <Chip size="small" label="Sent" color="success" />
                                                ) : (
                                                    <Chip
                                                        size="small"
                                                        label={email.dispatched ? 'Queued' : 'Pending'}
                                                        color={email.dispatched ? 'info' : 'warning'}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {email.editable ? (
                                                        <Button
                                                            size="small"
                                                            startIcon={<EditIcon />}
                                                            onClick={() => navigate(`/emails/scheduled/${email.id}/edit`)}
                                                        >
                                                            Edit
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            {tab === 'sent' && (
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<ContentCopyIcon />}
                                                                    onClick={() => handleCopyAsNewEmail(email)}
                                                                >
                                                                    Copy
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="small"
                                                                startIcon={<VisibilityIcon />}
                                                                onClick={() => setSelectedEmail(email)}
                                                            >
                                                                View
                                                            </Button>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={sortedEmails.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Paper>
        </Box>
    );
}
