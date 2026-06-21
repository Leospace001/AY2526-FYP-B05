import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Box, IconButton, Select, MenuItem, Divider, Tooltip, TextField,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { fileToEmbeddedDataUrl } from '../utils/emailImageEmbed';

const EMAIL_IMAGE = Image.configure({
    inline: true,
    allowBase64: true,
});

const HEADING_OPTIONS = [
    { label: 'Paragraph', value: 'paragraph' },
    { label: 'Heading 1', value: '1' },
    { label: 'Heading 2', value: '2' },
    { label: 'Heading 3', value: '3' },
] as const;

const TEXT_COLORS = ['#2c3e50', '#e74c3c', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6'];

interface EmailHtmlEditorProps {
    html: string;
    onChange: (html: string) => void;
    isCodeView: boolean;
    onToggleCodeView: () => void;
}

function getActiveHeading(editor: NonNullable<ReturnType<typeof useEditor>>): string {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    return 'paragraph';
}

export default function EmailHtmlEditor({ html, onChange, isCodeView, onToggleCodeView }: EmailHtmlEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const skipExternalSyncRef = useRef(false);
    const editorRef = useRef<ReturnType<typeof useEditor>>(null);

    const insertEmbeddedImage = useCallback(async (file: File) => {
        const editorInstance = editorRef.current;
        if (!editorInstance || !file.type.startsWith('image/')) {
            return;
        }

        const src = await fileToEmbeddedDataUrl(file);
        editorInstance.chain().focus().setImage({ src }).run();
        skipExternalSyncRef.current = true;
        onChange(editorInstance.getHTML());
    }, [onChange]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            EMAIL_IMAGE,
            Placeholder.configure({ placeholder: 'Compose your email message…' }),
        ],
        content: html || '<p></p>',
        onUpdate: ({ editor: ed }) => {
            skipExternalSyncRef.current = true;
            onChange(ed.getHTML());
        },
        editorProps: {
            handlePaste: (_view, event) => {
                const items = event.clipboardData?.items;
                if (!items) {
                    return false;
                }

                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (file) {
                            void insertEmbeddedImage(file);
                        }
                        return true;
                    }
                }

                return false;
            },
            handleDrop: (_view, event) => {
                const imageFile = Array.from(event.dataTransfer?.files ?? [])
                    .find((file) => file.type.startsWith('image/'));
                if (!imageFile) {
                    return false;
                }

                event.preventDefault();
                void insertEmbeddedImage(imageFile);
                return true;
            },
        },
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        if (!editor || isCodeView) return;

        if (skipExternalSyncRef.current) {
            skipExternalSyncRef.current = false;
            return;
        }

        const current = editor.getHTML();
        if (html !== current) {
            editor.commands.setContent(html || '<p></p>', false);
        }
    }, [html, editor, isCodeView]);

    const handleHeadingChange = (value: string) => {
        if (!editor) return;
        if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else {
            const level = Number(value) as 1 | 2 | 3;
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    const handleSetLink = () => {
        if (!editor) return;
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Enter link URL:', previous ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleInsertImage = (file: File) => {
        void insertEmbeddedImage(file);
    };

    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ border: '1px solid #dcdde1', borderRadius: 1, overflow: 'hidden', bgcolor: '#fff' }}>
            {!isCodeView && (
                <Box sx={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5,
                    p: 1, bgcolor: '#f5f6fa', borderBottom: '1px solid #dcdde1',
                }}>
                    <Select
                        size="small"
                        value={getActiveHeading(editor)}
                        onChange={(e) => handleHeadingChange(e.target.value)}
                        sx={{ minWidth: 120, bgcolor: '#fff', fontSize: '0.85rem' }}
                    >
                        {HEADING_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                    <Tooltip title="Bold"><span><IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBoldIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Italic"><span><IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalicIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Underline"><span><IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlinedIcon fontSize="small" /></IconButton></span></Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                    {TEXT_COLORS.map((color) => (
                        <IconButton
                            key={color}
                            size="small"
                            onClick={() => editor.chain().focus().setColor(color).run()}
                            sx={{ p: 0.5 }}
                        >
                            <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: color, border: '1px solid #ccc' }} />
                        </IconButton>
                    ))}

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                    <Tooltip title="Bullet list"><span><IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulletedIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Numbered list"><span><IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumberedIcon fontSize="small" /></IconButton></span></Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                    <Tooltip title="Align left"><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeftIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Align center"><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenterIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Align right"><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRightIcon fontSize="small" /></IconButton></span></Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                    <Tooltip title="Insert link"><span><IconButton size="small" onClick={handleSetLink} color={editor.isActive('link') ? 'primary' : 'default'}><LinkIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Insert image">
                        <span>
                            <IconButton size="small" onClick={() => imageInputRef.current?.click()}><ImageIcon fontSize="small" /></IconButton>
                        </span>
                    </Tooltip>
                    <input
                        ref={imageInputRef}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInsertImage(file);
                            e.target.value = '';
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <Tooltip title="Undo"><span><IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><UndoIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Redo"><span><IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><RedoIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title={isCodeView ? 'Visual editor' : 'HTML source'}>
                        <span>
                            <IconButton size="small" onClick={onToggleCodeView} color={isCodeView ? 'primary' : 'default'}>
                                <CodeIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            {isCodeView ? (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, bgcolor: '#f5f6fa', borderBottom: '1px solid #dcdde1' }}>
                        <Tooltip title="Back to visual editor">
                            <IconButton size="small" onClick={onToggleCodeView} color="primary"><CodeIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        minRows={14}
                        value={html}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="<p>Your HTML email template</p>"
                        sx={{
                            '& .MuiInputBase-root': {
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '0.9rem',
                                p: 2,
                            },
                            '& fieldset': { border: 'none' },
                        }}
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        minHeight: 300,
                        '& .ProseMirror': {
                            minHeight: 300,
                            p: 3,
                            outline: 'none',
                            fontSize: '1rem',
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            lineHeight: 1.6,
                            '& p': { margin: '0 0 8px 0' },
                            '& h1': { fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px' },
                            '& h2': { fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 10px' },
                            '& h3': { fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 10px' },
                            '& ul, & ol': { pl: 3, my: 1 },
                            '& a': { color: '#1976d2' },
                            '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 1, display: 'block' },
                            '& p.is-editor-empty:first-of-type::before': {
                                color: '#adb5bd',
                                content: 'attr(data-placeholder)',
                                float: 'left',
                                height: 0,
                                pointerEvents: 'none',
                            },
                        },
                    }}
                >
                    <EditorContent editor={editor} />
                </Box>
            )}
        </Box>
    );
}
