import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import EmailHtmlEditor from '../components/EmailHtmlEditor';
import { htmlContainsBrokenEmbeddedImages } from '../utils/emailImageEmbed';
import { attachmentFileName, type EmailComposeDraft } from '../utils/emailCompose';
import { APP_TIME_ZONE_LABEL, toHongKongApiDateTime } from '../utils/hongKongTime';
import type { EmailRecordSummary } from './EmailOutbox';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    CircularProgress, Snackbar, Alert, Divider, IconButton, List, ListItem, ListItemText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EMPTY_BODY = '<p></p>';

function applyComposeDraft(
    draft: EmailComposeDraft,
    setRecipientString: (value: string) => void,
    setSubject: (value: string) => void,
    setHtmlBody: (value: string) => void,
    setReusedAttachmentPaths: (value: string[]) => void,
    setSendTime: (value: string) => void,
) {
    setRecipientString(draft.recipients.join(', '));
    setSubject(draft.subject);
    setHtmlBody(draft.body?.trim() || EMPTY_BODY);
    setReusedAttachmentPaths(draft.attachmentPaths ?? []);
    setSendTime('');
}

export default function SendEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [recipientString, setRecipientString] = useState('');
    const [subject, setSubject] = useState('');
    const [sendTime, setSendTime] = useState('');
    const [htmlBody, setHtmlBody] = useState(EMPTY_BODY);
    const [isCodeView, setIsCodeView] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [reusedAttachmentPaths, setReusedAttachmentPaths] = useState<string[]>([]);
    const [copySourceLabel, setCopySourceLabel] = useState('');
    const [loadingDraft, setLoadingDraft] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    useEffect(() => {
        const draft = location.state?.draft as EmailComposeDraft | undefined;
        if (draft) {
            applyComposeDraft(
                draft,
                setRecipientString,
                setSubject,
                setHtmlBody,
                setReusedAttachmentPaths,
                setSendTime,
            );
            setCopySourceLabel(location.state?.copySourceLabel ?? 'Copied from a sent email. Edit anything before sending.');
            return;
        }

        const copyFromId = searchParams.get('copyFrom');
        if (!copyFromId) {
            return;
        }

        const loadCopiedEmail = async () => {
            setLoadingDraft(true);
            try {
                const response = await api.get<EmailRecordSummary>(`/api/emails/outbox/${copyFromId}`);
                const email = response.data;
                applyComposeDraft(
                    {
                        recipients: email.recipients ?? [],
                        subject: email.subject ?? '',
                        body: email.body ?? '',
                        attachmentPaths: email.attachmentPaths ?? [],
                    },
                    setRecipientString,
                    setSubject,
                    setHtmlBody,
                    setReusedAttachmentPaths,
                    setSendTime,
                );
                setCopySourceLabel(`Copied from "${email.subject || 'sent email'}". Edit anything before sending.`);
            } catch (err: unknown) {
                console.error(err);
                const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
                setSnackbar({
                    open: true,
                    message: apiErr.response?.data?.message ?? apiErr.message ?? 'Could not load the email to copy.',
                    severity: 'error',
                });
            } finally {
                setLoadingDraft(false);
            }
        };

        loadCopiedEmail();
    }, [location.state, searchParams]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeReusedAttachment = (pathToRemove: string) => {
        setReusedAttachmentPaths((prev) => prev.filter((path) => path !== pathToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const recipientsArray = recipientString.split(',').map((em) => em.trim()).filter(Boolean);
        if (recipientsArray.length === 0) {
            setSnackbar({ open: true, message: 'Please specify at least one recipient.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        const trimmedBody = htmlBody.trim();
        if (!trimmedBody || trimmedBody === EMPTY_BODY || trimmedBody === '<p></p>') {
            setSnackbar({ open: true, message: 'Please compose an email body.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        if (htmlContainsBrokenEmbeddedImages(htmlBody)) {
            setSnackbar({
                open: true,
                message: 'An embedded image is not ready. Re-insert the image using the toolbar before sending.',
                severity: 'error',
            });
            setSubmitting(false);
            return;
        }

        const multipartPayload = new FormData();
        recipientsArray.forEach((rec) => multipartPayload.append('recipients', rec));
        multipartPayload.append('subject', subject);
        multipartPayload.append('body', htmlBody);

        if (sendTime) {
            multipartPayload.append('sendTime', toHongKongApiDateTime(sendTime));
        }
        attachments.forEach((file) => multipartPayload.append('attachments', file));
        reusedAttachmentPaths.forEach((path) => multipartPayload.append('reuseAttachmentPaths', path));

        try {
            const response = await api.post('/api/emails/send', multipartPayload);
            const message = response.data?.includes?.('scheduled')
                ? 'Email scheduled successfully!'
                : 'HTML email sent successfully!';
            setSnackbar({ open: true, message, severity: 'success' });
            setRecipientString('');
            setSubject('');
            setSendTime('');
            setAttachments([]);
            setReusedAttachmentPaths([]);
            setHtmlBody(EMPTY_BODY);
            setIsCodeView(false);
            setCopySourceLabel('');
        } catch (error: unknown) {
            console.error(error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const message = err.response?.data?.message ?? err.message ?? 'Failed to send email.';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingDraft) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/email')} color="inherit">
                    Inbox
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Compose Email
                </Typography>
            </Box>

            {copySourceLabel && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    {copySourceLabel}
                </Alert>
            )}

            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Recipients (comma-separated)"
                            placeholder="team@example.com"
                            value={recipientString}
                            onChange={(e) => setRecipientString(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Subject"
                            placeholder="Enter subject line"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#57606f' }}>
                            Message (formatted text → HTML)
                        </Typography>
                        <EmailHtmlEditor
                            html={htmlBody}
                            onChange={setHtmlBody}
                            isCodeView={isCodeView}
                            onToggleCodeView={() => setIsCodeView((prev) => !prev)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label={`Schedule send (${APP_TIME_ZONE_LABEL})`}
                            value={sendTime}
                            onChange={(e) => setSendTime(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            helperText={`Optional. Enter the date and time in ${APP_TIME_ZONE_LABEL}. Leave empty to send immediately.`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ py: 1.5, borderStyle: 'dashed' }}>
                            Attach files
                            <input type="file" hidden multiple onChange={handleFileChange} />
                        </Button>
                    </Grid>

                    {reusedAttachmentPaths.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Attachments from copied email ({reusedAttachmentPaths.length})
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: '#fafafa', borderRadius: 2, maxHeight: 150, overflowY: 'auto' }}>
                                <List dense>
                                    {reusedAttachmentPaths.map((path) => (
                                        <ListItem
                                            key={path}
                                            secondaryAction={
                                                <IconButton edge="end" color="error" onClick={() => removeReusedAttachment(path)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText
                                                primary={attachmentFileName(path)}
                                                secondary="Reused from the original sent email"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    {attachments.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                New attachments ({attachments.length})
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: '#fafafa', borderRadius: 2, maxHeight: 150, overflowY: 'auto' }}>
                                <List dense>
                                    {attachments.map((file, idx) => (
                                        <ListItem
                                            key={`${file.name}-${idx}`}
                                            secondaryAction={
                                                <IconButton edge="end" color="error" onClick={() => removeAttachment(idx)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="text" color="inherit" disabled={submitting} onClick={() => navigate('/email')}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            endIcon={!submitting && <SendIcon />}
                            disabled={submitting}
                            sx={{ px: 4, fontWeight: 'bold' }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : (sendTime ? 'Schedule Email' : 'Send Email')}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
