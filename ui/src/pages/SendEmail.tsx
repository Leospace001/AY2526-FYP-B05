import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
    Box, Typography, Paper, TextField, Button, Grid, 
    CircularProgress, Snackbar, Alert, Divider, IconButton, List, ListItem, ListItemText,
    MenuItem, Select, FormControl, Popover
} from '@mui/material';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; 
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset'; 
import FormatColorTextIcon from '@mui/icons-material/FormatColorText'; 
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import TableChartIcon from '@mui/icons-material/TableChart';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CodeIcon from '@mui/icons-material/Code'; 
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';

// Popover Icons
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

export default function SendEmail() {
    const navigate = useNavigate();
    const editorRef = useRef<HTMLDivElement>(null);

    // Form inputs
    const [recipientString, setRecipientString] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [sendTime, setSendTime] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);

    // Toolbar configurations
    const [textStyle, setTextStyle] = useState<string>('P'); // Default to capital block tag
    const [fontFamily, setFontFamily] = useState<string>('Helvetica Neue');
    const [textColor, setTextColor] = useState<string>('#2c3e50');
    const [textAlign, setTextAlign] = useState<string>('left');
    const [isCodeView, setIsCodeView] = useState<boolean>(false);
    const [rawHtmlBody, setRawHtmlBody] = useState<string>('<p>safsaa</p>');

    // Popover states
    const [imageAnchorEl, setImageAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [inlineImageFile, setInlineImageFile] = useState<File | null>(null);
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    // Global states
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // 🚀 Robust Command Runner: Ensures focus remains on selection
    const executeEditorCommand = (command: string, value: string = '') => {
        if (isCodeView) return;
        
        if (editorRef.current) {
            editorRef.current.focus(); // Force re-focus back to text canvas
        }
        
        document.execCommand(command, false, value);
    };

    // 🚀 Helper to backup selection range when using dropdown components
    const backupSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0));
        }
    };

    // 🚀 Helper to restore selection coordinates right before applying modifications
    const restoreSelection = () => {
        if (!savedRange) return;
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }
    };

    const handleHeadingChange = (sizeTag: string) => {
        setTextStyle(sizeTag);
        restoreSelection();
        executeEditorCommand('formatBlock', sizeTag); // Needs uppercase tags like 'H1', 'H2', 'P'
    };

    const handleToggleCodeView = () => {
        if (isCodeView) {
            setIsCodeView(false);
            setTimeout(() => {
                if (editorRef.current) editorRef.current.innerHTML = rawHtmlBody;
            }, 50);
        } else {
            const currentHtml = editorRef.current ? editorRef.current.innerHTML : '';
            setRawHtmlBody(currentHtml);
            setIsCodeView(true);
        }
    };

    const handleOpenImagePopup = (event: React.MouseEvent<HTMLButtonElement>) => {
        backupSelection();
        setImageAnchorEl(event.currentTarget);
    };

    const handleConfirmInlineImage = () => {
        if (!inlineImageFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64DataUrl = event.target?.result as string;
            restoreSelection();
            executeEditorCommand('insertImage', base64DataUrl);
            setImageAnchorEl(null);
            setInlineImageFile(null);
        };
        reader.readAsDataURL(inlineImageFile);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const multipartPayload = new FormData();
        const recipientsArray = recipientString.split(',').map(em => em.trim()).filter(em => em.length > 0);

        if (recipientsArray.length === 0) {
            setSnackbar({ open: true, message: 'Please specify at least one recipient.', severity: 'error' });
            setSubmitting(false);
            return;
        }

        recipientsArray.forEach(rec => multipartPayload.append('recipients', rec));
        multipartPayload.append('subject', subject);
        
        const activeFinalHtmlBody = isCodeView ? rawHtmlBody : (editorRef.current ? editorRef.current.innerHTML : '');
        multipartPayload.append('body', activeFinalHtmlBody);

        if (sendTime) {
            multipartPayload.append('sendTime', new Date(sendTime).toISOString());
        }
        attachments.forEach(file => multipartPayload.append('attachments', file));

        try {
            await api.post('/api/emails/send', multipartPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSnackbar({ open: true, message: 'HTML email campaign sent successfully!', severity: 'success' });
            setRecipientString('');
            setSubject('');
            setSendTime('');
            setAttachments([]);
            if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>';
            setRawHtmlBody('<p><br></p>');
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to dispatch email campaign.', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} color="inherit">
                    Dashboard
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Email Studio Workspace
                </Typography>
            </Box>

            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="Recipients (Comma-separated)" name="recipients" placeholder="team@app.com" value={recipientString} onChange={(e) => setRecipientString(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="Subject Line" name="subject" placeholder="Enter message subject line..." value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </Grid>

                    {/* --- THE TEXT EDITOR CANVAS ASSEMBLY --- */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: '1px solid #dcdde1', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
                            
                            {/* --- VISUAL TOOLBAR DECK (onMouseDown overrides applied) --- */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: '6px', gap: '4px', backgroundColor: '#f5f6fa', borderBottom: '1px solid #dcdde1' }}>
                                
                                {/* Heading selection wrapper */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', bgcolor: '#fff', px: '4px', height: '32px' }}>
                                    <AutoFixHighIcon fontSize="small" sx={{ color: '#57606f', mr: 0.5 }} />
                                    <Select 
                                        variant="standard" 
                                        disableUnderline 
                                        value={textStyle} 
                                        onMouseDown={backupSelection} // Back up active context coordinates
                                        onChange={(e) => handleHeadingChange(e.target.value)} 
                                        sx={{ fontSize: '0.85rem', width: '45px' }}
                                    >
                                        <MenuItem value="P">Paragraph</MenuItem>
                                        <MenuItem value="H1">Heading 1</MenuItem>
                                        <MenuItem value="H2">Heading 2</MenuItem>
                                        <MenuItem value="H3">Heading 3</MenuItem>
                                    </Select>
                                </Box>

                                {/* Style Action Buttons using onMouseDown overrides */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', bgcolor: '#fff', height: '32px' }}>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('bold'); }} sx={{ borderRadius: 0 }}><FormatBoldIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('underline'); }} sx={{ borderRadius: 0, borderLeft: '1px solid #eee', borderRight: '1px solid #eee' }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('removeFormat'); }} sx={{ borderRadius: 0 }}><FormatColorResetIcon fontSize="small" /></IconButton>
                                </Box>

                                {/* Font family choice */}
                                <FormControl size="small" sx={{ m: 0, minWidth: 140, height: '32px', '& .MuiOutlinedInput-root': { height: '32px', backgroundColor: '#fff' } }}>
                                    <Select 
                                        value={fontFamily} 
                                        onMouseDown={backupSelection}
                                        onChange={(e) => { setFontFamily(e.target.value); restoreSelection(); executeEditorCommand('fontName', e.target.value); }} 
                                        sx={{ fontSize: '0.85rem' }}
                                    >
                                        <MenuItem value="Helvetica Neue">Helvetica Neue</MenuItem>
                                        <MenuItem value="Arial">Arial</MenuItem>
                                        <MenuItem value="Roboto">Roboto</MenuItem>
                                        <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Text Font Color */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', bgcolor: '#fff', px: '4px', height: '32px' }}>
                                    <FormatColorTextIcon fontSize="small" sx={{ color: textColor }} />
                                    <Select 
                                        variant="standard" 
                                        disableUnderline 
                                        value={textColor} 
                                        onMouseDown={backupSelection}
                                        onChange={(e) => { setTextColor(e.target.value); restoreSelection(); executeEditorCommand('foreColor', e.target.value); }} 
                                        sx={{ fontSize: '0.85rem', width: '32px', ml: 0.5 }}
                                    >
                                        <MenuItem value="#2c3e50"><Box sx={{ width: 12, height: 12, bgcolor: '#2c3e50', borderRadius: '50%' }} /></MenuItem>
                                        <MenuItem value="#e74c3c"><Box sx={{ width: 12, height: 12, bgcolor: '#e74c3c', borderRadius: '50%' }} /></MenuItem>
                                        <MenuItem value="#2ecc71"><Box sx={{ width: 12, height: 12, bgcolor: '#2ecc71', borderRadius: '50%' }} /></MenuItem>
                                        <MenuItem value="#f1c40f"><Box sx={{ width: 12, height: 12, bgcolor: '#f1c40f', borderRadius: '50%' }} /></MenuItem>
                                    </Select>
                                </Box>

                                {/* Ordered and Unordered lists buttons */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', bgcolor: '#fff', height: '32px' }}>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('insertUnorderedList'); }} sx={{ borderRadius: 0, borderRight: '1px solid #eee' }}><FormatListBulletedIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('insertOrderedList'); }} sx={{ borderRadius: 0 }}><FormatListNumberedIcon fontSize="small" /></IconButton>
                                </Box>

                                {/* Alignment drop-down choices */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', bgcolor: '#fff', px: '4px', height: '32px' }}>
                                    <FormatAlignLeftIcon fontSize="small" sx={{ color: '#57606f' }} />
                                    <Select 
                                        variant="standard" 
                                        disableUnderline 
                                        value={textAlign} 
                                        onMouseDown={backupSelection}
                                        onChange={(e) => { setTextAlign(e.target.value); restoreSelection(); executeEditorCommand(`justify${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)}`); }} 
                                        sx={{ fontSize: '0.85rem', width: '32px', ml: 0.5 }}
                                    >
                                        <MenuItem value="left">Left</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="right">Right</MenuItem>
                                    </Select>
                                </Box>

                                {/* Insert Group elements */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', bgcolor: '#fff', height: '32px' }}>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); executeEditorCommand('insertHorizontalRule'); }} sx={{ borderRadius: 0, borderRight: '1px solid #eee' }}><TableChartIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onMouseDown={(e) => { e.preventDefault(); const url = prompt("Enter link address:"); if(url) executeEditorCommand('createLink', url); }} sx={{ borderRadius: 0, borderRight: '1px solid #eee' }}><LinkIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={handleOpenImagePopup} sx={{ borderRadius: 0, borderRight: '1px solid #eee' }} color={Boolean(imageAnchorEl) ? "primary" : "default"}><ImageIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" sx={{ borderRadius: 0 }}><VideoCameraBackIcon fontSize="small" /></IconButton>
                                </Box>

                                {/* System actions layout drawer elements */}
                                <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', display: 'flex', bgcolor: '#fff', height: '32px', ml: 'auto' }}>
                                    <IconButton size="small" sx={{ borderRadius: 0, borderRight: '1px solid #eee' }}><FullscreenIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={handleToggleCodeView} color={isCodeView ? "primary" : "default"} sx={{ borderRadius: 0, borderRight: '1px solid #eee', bgcolor: isCodeView ? '#e3f2fd' : 'transparent' }}><CodeIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" sx={{ borderRadius: 0 }}><HelpOutlinedIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>

                            {/* Floating image controller popover card */}
                            <Popover
                                open={Boolean(imageAnchorEl)}
                                anchorEl={imageAnchorEl}
                                onClose={() => setImageAnchorEl(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                sx={{ '& .MuiPaper-root': { borderRadius: 2, p: 1.5, mt: 0.5, boxShadow: 3 } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: '320px' }}>
                                    <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1, pl: 1 }}>
                                        {inlineImageFile ? inlineImageFile.name : "Click icon to attach image"}
                                    </Typography>
                                    <IconButton component="label" size="small" sx={{ bgcolor: '#ebebeb' }}>
                                        <AttachFileIcon fontSize="small" />
                                        <input type="file" hidden accept="image/*" onChange={(e) => e.target.files && setInlineImageFile(e.target.files[0])} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => { setImageAnchorEl(null); setInlineImageFile(null); }}><CloseIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="success" disabled={!inlineImageFile} onClick={handleConfirmInlineImage} sx={{ bgcolor: inlineImageFile ? '#e8f5e9' : 'transparent' }}><CheckIcon fontSize="small" /></IconButton>
                                </Box>
                            </Popover>

                            {/* --- MAIN RENDERING LAYOUT PANE VIEWPORTS --- */}
                            {isCodeView ? (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={12}
                                    value={rawHtmlBody}
                                    onChange={(e) => setRawHtmlBody(e.target.value)}
                                    sx={{
                                        '& .MuiInputBase-root': { p: 3, fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.9rem' },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                                    }}
                                />
                            ) : (
                                <Box
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    sx={{
                                        minHeight: '300px',
                                        p: 3,
                                        backgroundColor: '#fff',
                                        outline: 'none',
                                        overflowY: 'auto',
                                        fontSize: '1rem',
                                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                        lineHeight: '1.6',
                                        '& h1': { fontSize: '2rem', margin: '0 0 10px 0', fontWeight: 'bold' },
                                        '& h2': { fontSize: '1.5rem', margin: '0 0 10px 0', fontWeight: 'bold' },
                                        '& h3': { fontSize: '1.25rem', margin: '0 0 10px 0', fontWeight: 'bold' },
                                        '& p': { margin: '0 0 8px 0' },
                                        '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 1, display: 'block' }
                                    }}
                                    onBlur={() => { if(editorRef.current) setRawHtmlBody(editorRef.current.innerHTML); }}
                                >
                                    <p style={{ color: '#c0392b', textDecoration: 'underline' }}>safsaa</p>
                                </Box>
                            )}

                            {/* Decorative resizer indicator bar footer element */}
                            <Box sx={{ height: '10px', backgroundColor: '#f5f6fa', borderTop: '1px solid #dcdde1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Box sx={{ width: '30px', height: '4px', borderTop: '1px double #aaa', borderBottom: '1px solid #aaa' }} />
                            </Box>
                        </Box>
                    </Grid>

                    {/* Schedulers and standalone attachment file managers */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth type="datetime-local" label="Schedule Broadcast Delay (Optional)" name="sendTime" value={sendTime} onChange={(e) => setSendTime(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Leave clear to process immediately" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ py: 1.5, borderStyle: 'dashed' }}>
                            Include Separate Document Attachments
                            <input type="file" hidden multiple onChange={handleFileChange} />
                        </Button>
                    </Grid>

                    {attachments.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Selected Files ({attachments.length}):</Typography>
                            <Paper variant="outlined" sx={{ bgcolor: '#fafafa', borderRadius: 2, maxHeight: '150px', overflowY: 'auto' }}>
                                <List dense>
                                    {attachments.map((file, idx) => (
                                        <ListItem key={idx} secondaryAction={<IconButton edge="end" color="error" onClick={() => removeAttachment(idx)}><DeleteIcon /></IconButton>}>
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 0.5 }} /></Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="text" color="inherit" disabled={submitting} onClick={() => navigate('/')}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" size="large" endIcon={!submitting && <SendIcon />} disabled={submitting} sx={{ px: 4, fontWeight: 'bold' }}>
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Email'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}