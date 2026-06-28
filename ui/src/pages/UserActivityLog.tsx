import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, TextField, Button, CircularProgress,
    Chip, InputAdornment,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api/axiosConfig';

interface LogEvent {
    id: number;
    username: string;
    path: string;
    httpMethod: string;
    actionAt: string;
    durationMs: number | null;
}

interface LogEventPage {
    content: LogEvent[];
    totalElements: number;
}

const METHOD_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
    GET: 'primary',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'error',
};

function formatActionAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString();
}

export default function UserActivityLog() {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [usernameFilter, setUsernameFilter] = useState('');
    const [appliedFilter, setAppliedFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                size: String(rowsPerPage),
            });
            if (appliedFilter.trim()) {
                params.set('username', appliedFilter.trim());
            }
            const response = await api.get<LogEventPage>(`/api/admin/log-events?${params.toString()}`);
            setEvents(response.data.content ?? []);
            setTotalElements(response.data.totalElements ?? 0);
        } catch (error) {
            console.error('Failed to load activity logs:', error);
            setEvents([]);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, appliedFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = () => {
        setPage(0);
        setAppliedFilter(usernameFilter);
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <HistoryIcon sx={{ fontSize: 32, color: '#3498db' }} />
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        User Activity Log
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Authenticated API requests recorded by the system.
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label="Filter by username"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 240 }}
                    />
                    <Button variant="contained" onClick={handleSearch}>
                        Search
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchLogs}>
                        Refresh
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Duration</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        No activity records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatActionAt(event.actionAt)}
                                        </TableCell>
                                        <TableCell>{event.username}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.httpMethod}
                                                size="small"
                                                color={METHOD_COLORS[event.httpMethod] ?? 'default'}
                                                sx={{ fontWeight: 'bold', minWidth: 72 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ wordBreak: 'break-all' }}>{event.path}</TableCell>
                                        <TableCell align="right">
                                            {event.durationMs != null ? `${event.durationMs} ms` : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </Paper>
        </Box>
    );
}
