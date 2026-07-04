import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axiosConfig';
import { formatHongKongDateTime } from '../utils/hongKongTime';

interface MailBoxDto {
    subject: string;
    sender: string;
    to: string[];
    cc: string[];
    bcc: string[];
    body: string;
    receivedAt?: string | null;
}

type SortField = 'receivedAt' | 'sender' | 'to' | 'subject';
type SortDirection = 'asc' | 'desc';

const INBOX_FETCH_LIMIT = 100;

function compareStrings(a: string, b: string): number {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function compareDates(a: string | null | undefined, b: string | null | undefined): number {
    const timeA = a ? new Date(a).getTime() : 0;
    const timeB = b ? new Date(b).getTime() : 0;
    return timeA - timeB;
}

function formatRecipients(values: string[] | undefined): string {
    if (!values || values.length === 0) {
        return '—';
    }
    return values.join(', ');
}

function InboxHeader({
    messageCount,
    onRefresh,
    refreshing,
}: {
    messageCount?: number;
    onRefresh: () => void;
    refreshing: boolean;
}) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: '#1976d2' }}>
                <EmailIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    System Inbox
                </Typography>
                {messageCount !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                        {messageCount} {messageCount === 1 ? 'message' : 'messages'} loaded
                    </Typography>
                )}
            </Box>
            <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={onRefresh}
                disabled={refreshing}
            >
                Refresh
            </Button>
            <Button component={RouterLink} to="/emails/outbox" variant="outlined">
                Sent / Scheduled
            </Button>
            <Button component={RouterLink} to="/emails/send" variant="contained" startIcon={<EditIcon />}>
                Compose
            </Button>
        </Box>
    );
}

export default function EmailInbox() {
    const [emails, setEmails] = useState<MailBoxDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<MailBoxDto | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('receivedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchEmails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get<MailBoxDto[]>(`/api/emails/inbox?limit=${INBOX_FETCH_LIMIT}`);
            setEmails(response.data ?? []);
        } catch (err: unknown) {
            console.error('Failed to fetch emails:', err);
            const apiErr = err as {
                message?: string;
                response?: { status?: number; data?: { message?: string; error?: string } };
            };
            if (apiErr.response?.status === 401) {
                setError('Your session expired. Please log in again.');
            } else if (apiErr.response?.status === 504) {
                setError('Server timed out while reading the inbox. Try again in a moment.');
            } else {
                setError(
                    apiErr.response?.data?.message
                    ?? apiErr.response?.data?.error
                    ?? apiErr.message
                    ?? 'Could not connect to the mail server. Check your backend logs.',
                );
            }
            setEmails([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'receivedAt' ? 'desc' : 'asc');
        }
    };

    const handleSearch = () => {
        setPage(0);
        setAppliedSearch(searchQuery.trim());
    };

    const filteredEmails = useMemo(() => {
        const query = appliedSearch.toLowerCase();
        if (!query) {
            return emails;
        }
        return emails.filter((email) => {
            const haystack = [
                email.subject,
                email.sender,
                formatRecipients(email.to),
                formatRecipients(email.cc),
                email.body,
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [appliedSearch, emails]);

    const sortedEmails = useMemo(() => {
        const sorted = [...filteredEmails];
        sorted.sort((a, b) => {
            let result = 0;
            switch (sortField) {
                case 'receivedAt':
                    result = compareDates(a.receivedAt, b.receivedAt);
                    break;
                case 'sender':
                    result = compareStrings(a.sender ?? '', b.sender ?? '');
                    break;
                case 'to':
                    result = compareStrings(formatRecipients(a.to), formatRecipients(b.to));
                    break;
                case 'subject':
                    result = compareStrings(a.subject ?? '', b.subject ?? '');
                    break;
                default:
                    result = 0;
            }
            return sortDirection === 'asc' ? result : -result;
        });
        return sorted;
    }, [filteredEmails, sortDirection, sortField]);

    const paginatedEmails = useMemo(
        () => sortedEmails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage, sortedEmails],
    );

    if (selectedEmail) {
        return (
            <Box sx={{ p: 4, backgroundColor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ maxWidth: '900px', width: '100%' }}>
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <IconButton onClick={() => setSelectedEmail(null)} sx={{ mr: 2, bgcolor: '#f0f0f0' }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {selectedEmail.subject || '(No Subject)'}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" sx={{ mb: 0.5 }}>
                            <strong>From:</strong> {selectedEmail.sender || '—'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 0.5 }}>
                            <strong>To:</strong> {formatRecipients(selectedEmail.to)}
                        </Typography>
                        {selectedEmail.cc?.length > 0 && (
                            <Typography variant="body1" sx={{ mb: 0.5 }}>
                                <strong>Cc:</strong> {formatRecipients(selectedEmail.cc)}
                            </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            <strong>Received:</strong> {formatHongKongDateTime(selectedEmail.receivedAt ?? null)}
                        </Typography>
                    </Paper>

                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            minHeight: '400px',
                            overflowX: 'auto',
                            '& img': { maxWidth: '100%', height: 'auto' },
                        }}
                    >
                        {selectedEmail.body ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                        ) : (
                            <Typography sx={{ color: 'gray', fontStyle: 'italic' }}>
                                This email has no body content.
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
            <InboxHeader messageCount={emails.length} onRefresh={fetchEmails} refreshing={loading} />

            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label="Search inbox"
                        placeholder="Subject, sender, recipient, or body"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ minWidth: 280, flexGrow: 1 }}
                    />
                    <Button variant="contained" onClick={handleSearch}>
                        Search
                    </Button>
                    {appliedSearch && (
                        <Button
                            variant="text"
                            onClick={() => {
                                setSearchQuery('');
                                setAppliedSearch('');
                                setPage(0);
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sortDirection={sortField === 'receivedAt' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'receivedAt'}
                                        direction={sortField === 'receivedAt' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('receivedAt')}
                                    >
                                        Received (HKT)
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'sender' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'sender'}
                                        direction={sortField === 'sender' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('sender')}
                                    >
                                        From
                                    </TableSortLabel>
                                </TableCell>
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} sx={{ mb: 1 }} />
                                        <Typography sx={{ display: 'block' }} color="text.secondary">
                                            Connecting to IMAP server...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedEmails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                        {appliedSearch ? 'No messages match your search.' : 'Your inbox is currently empty.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedEmails.map((email, index) => (
                                    <TableRow
                                        key={`${email.receivedAt ?? 'unknown'}-${email.sender}-${email.subject}-${index}`}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedEmail(email)}
                                    >
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatHongKongDateTime(email.receivedAt ?? null)}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
                                            {email.sender || '—'}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 260, wordBreak: 'break-word' }}>
                                            {formatRecipients(email.to)}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 360, wordBreak: 'break-word' }}>
                                            {email.subject || '(No Subject)'}
                                        </TableCell>
                                    </TableRow>
                                ))
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
