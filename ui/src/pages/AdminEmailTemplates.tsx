import { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, CircularProgress,
    Snackbar, Alert, Tabs, Tab, Chip, Stack, Divider, Grid,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axiosConfig';

interface EmailTemplate {
    templateKey: string;
    displayName: string;
    subject: string;
    htmlContent: string;
    availableVariables: string[];
}

const PREVIEW_DEBOUNCE_MS = 400;

export default function AdminEmailTemplates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewError, setPreviewError] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const selectedTemplate = templates[selectedIndex] ?? null;

    const loadTemplateIntoForm = useCallback((template: EmailTemplate) => {
        setSubject(template.subject);
        setHtmlContent(template.htmlContent);
    }, []);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<EmailTemplate[]>('/api/admin/email-templates');
            const items = response.data ?? [];
            setTemplates(items);
            if (items.length > 0) {
                loadTemplateIntoForm(items[selectedIndex] ?? items[0]);
            }
        } catch (error) {
            console.error('Failed to load email templates:', error);
            setSnackbar({
                open: true,
                message: 'Could not load email templates.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [loadTemplateIntoForm, selectedIndex]);

    const refreshPreview = useCallback(async (templateKey: string, content: string) => {
        if (!content.trim()) {
            setPreviewHtml('');
            setPreviewError('Enter HTML content to see a preview.');
            return;
        }

        setPreviewLoading(true);
        try {
            const response = await api.post<{ renderedHtml: string }>(
                `/api/admin/email-templates/${templateKey}/preview`,
                { htmlContent: content },
            );
            setPreviewHtml(response.data.renderedHtml);
            setPreviewError('');
        } catch (error) {
            console.error('Failed to preview template:', error);
            const apiErr = error as { response?: { data?: { message?: string } } };
            setPreviewHtml('');
            setPreviewError(apiErr.response?.data?.message ?? 'Could not render preview.');
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedTemplate) {
            loadTemplateIntoForm(selectedTemplate);
        }
    }, [selectedTemplate, loadTemplateIntoForm]);

    useEffect(() => {
        if (!selectedTemplate) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            refreshPreview(selectedTemplate.templateKey, htmlContent);
        }, PREVIEW_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [selectedTemplate, htmlContent, refreshPreview]);

    const handleTabChange = (_: React.SyntheticEvent, newIndex: number) => {
        setSelectedIndex(newIndex);
        if (templates[newIndex]) {
            loadTemplateIntoForm(templates[newIndex]);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const response = await api.put<EmailTemplate>(
                `/api/admin/email-templates/${selectedTemplate.templateKey}`,
                { subject, htmlContent },
            );
            setTemplates(prev => prev.map(t =>
                t.templateKey === response.data.templateKey ? response.data : t,
            ));
            setSnackbar({
                open: true,
                message: `"${response.data.displayName}" template saved.`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Failed to save template:', error);
            const apiErr = error as { response?: { data?: { message?: string } } };
            setSnackbar({
                open: true,
                message: apiErr.response?.data?.message ?? 'Could not save template.',
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const response = await api.post<EmailTemplate>(
                `/api/admin/email-templates/${selectedTemplate.templateKey}/reset`,
            );
            setTemplates(prev => prev.map(t =>
                t.templateKey === response.data.templateKey ? response.data : t,
            ));
            loadTemplateIntoForm(response.data);
            setSnackbar({
                open: true,
                message: `"${response.data.displayName}" reset to default.`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Failed to reset template:', error);
            setSnackbar({
                open: true,
                message: 'Could not reset template.',
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (templates.length === 0) {
        return (
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Alert severity="warning">No email templates found.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <EmailIcon sx={{ fontSize: 32, color: '#3498db' }} />
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        Email Templates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Edit HTML on the left and see a live preview on the right with sample data.
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
                <Tabs
                    value={selectedIndex}
                    onChange={handleTabChange}
                    sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    {templates.map((template) => (
                        <Tab key={template.templateKey} label={template.displayName} />
                    ))}
                </Tabs>

                <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Available variables (sample values used in preview)
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        {(selectedTemplate?.availableVariables ?? []).map((variable) => (
                            <Chip
                                key={variable}
                                label={`\${${variable}}`}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Stack>

                    <TextField
                        fullWidth
                        label="Email subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                HTML source
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                minRows={22}
                                label="HTML content"
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                slotProps={{
                                    input: {
                                        sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <VisibilityIcon fontSize="small" color="action" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Live preview
                                </Typography>
                                {previewLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Subject: {subject || '(empty)'}
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{
                                    minHeight: 520,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    bgcolor: '#fafafa',
                                }}
                            >
                                {previewError ? (
                                    <Alert severity="warning" sx={{ m: 2 }}>
                                        {previewError}
                                    </Alert>
                                ) : previewHtml ? (
                                    <Box
                                        component="iframe"
                                        title="Email template preview"
                                        srcDoc={previewHtml}
                                        sandbox=""
                                        sx={{
                                            width: '100%',
                                            minHeight: 520,
                                            border: 0,
                                            bgcolor: '#fff',
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ p: 3, color: 'text.secondary' }}>
                                        Preview will appear here as you type.
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            Save Template
                        </Button>
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<RestoreIcon />}
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Reset to Default
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
