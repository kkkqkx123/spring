import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Group,
  TextInput,
  ActionIcon,
  Popover,
  Text,
  FileInput,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconSend,
  IconMoodSmile,
  IconPaperclip,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useTypingIndicator } from '../hooks/useRealTimeChat';
import { useSendMessage } from '../hooks/useChat';
import { debounce } from '../../../utils';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../../constants';

interface MessageInputProps {
  recipientId: number;
  recipientName: string;
  disabled?: boolean;
  placeholder?: string;
}

// Common emoji list for the picker
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
  '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️',
  '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
  '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
  '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
  '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️',
  '👅', '👄', '💋', '🩸', '👶', '🧒', '👦', '👧',
];

export const MessageInput: React.FC<MessageInputProps> = ({
  recipientId,
  recipientName,
  disabled = false,
  placeholder = `Message ${recipientName}...`,
}) => {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  
  const textInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startTyping, stopTyping } = useTypingIndicator(recipientId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Debounced typing indicator
  const debouncedStopTyping = useCallback(
    debounce(() => stopTyping(), 1000),
    [stopTyping]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setMessage(value);

    if (value.trim()) {
      startTyping();
      debouncedStopTyping();
    } else {
      stopTyping();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && !attachedFile) {
      return;
    }

    if (disabled || isSending) {
      return;
    }

    // For now, we'll only handle text messages
    // File attachment functionality can be extended later
    if (trimmedMessage) {
      sendMessage(
        {
          recipientId,
          content: trimmedMessage,
        },
        {
          onSuccess: () => {
            setMessage('');
            setAttachedFile(null);
            setFileError(null);
            stopTyping();
            
            // Focus back to input
            if (textInputRef.current) {
              textInputRef.current.focus();
            }
          },
          onError: (error) => {
            console.error('Failed to send message:', error);
            // Error handling is managed by the global error handler
          },
        }
      );
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const input = textInputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      
      setMessage(newMessage);
      setEmojiPopoverOpen(false);
      
      // Focus back to input and set cursor position
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setFileError(null);
    
    if (!file) {
      setAttachedFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError('File type not supported. Please select an image or document.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    setAttachedFile(file);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isMessageEmpty = !message.trim() && !attachedFile;

  return (
    <Box>
      {/* File attachment preview */}
      {attachedFile && (
        <Box
          p="xs"
          mb="xs"
          style={(theme) => ({
            backgroundColor: theme.colors.blue[0],
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.blue[2]}`,
          })}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconPaperclip size={16} />
              <Text size="sm" truncate style={{ maxWidth: 200 }}>
                {attachedFile.name}
              </Text>
              <Text size="xs" c="dimmed">
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </Text>
            </Group>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={removeAttachedFile}
              aria-label="Remove file"
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Box>
      )}

      {/* File error */}
      {fileError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          mb="xs"
          onClose={() => setFileError(null)}
          withCloseButton
        >
          {fileError}
        </Alert>
      )}

      {/* Message input */}
      <Group gap="xs" align="flex-end">
        <Box style={{ flex: 1 }}>
          <TextInput
            ref={textInputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            size="md"
            styles={{
              input: {
                paddingRight: 80, // Make room for emoji and file buttons
              },
            }}
            rightSection={
              <Group gap={4} pr="xs">
                {/* File attachment button */}
                <Tooltip label="Attach file">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isSending}
                    aria-label="Attach file"
                  >
                    <IconPaperclip size={16} />
                  </ActionIcon>
                </Tooltip>

                {/* Emoji picker button */}
                <Popover
                  opened={emojiPopoverOpen}
                  onChange={setEmojiPopoverOpen}
                  position="top-end"
                  withArrow
                  shadow="md"
                >
                  <Popover.Target>
                    <Tooltip label="Add emoji">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setEmojiPopoverOpen(!emojiPopoverOpen)}
                        disabled={disabled || isSending}
                        aria-label="Add emoji"
                      >
                        <IconMoodSmile size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Box w={280} mah={200} style={{ overflowY: 'auto' }}>
                      <Text size="xs" c="dimmed" mb="xs">
                        Click an emoji to add it
                      </Text>
                      <Box
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: 4,
                        }}
                      >
                        {COMMON_EMOJIS.map((emoji, index) => (
                          <ActionIcon
                            key={index}
                            variant="subtle"
                            size="sm"
                            onClick={() => handleEmojiSelect(emoji)}
                            style={{
                              fontSize: 16,
                              cursor: 'pointer',
                            }}
                          >
                            {emoji}
                          </ActionIcon>
                        ))}
                      </Box>
                    </Box>
                  </Popover.Dropdown>
                </Popover>
              </Group>
            }
          />
        </Box>

        {/* Send button */}
        <Tooltip label="Send message">
          <ActionIcon
            variant="filled"
            size="lg"
            onClick={handleSendMessage}
            disabled={disabled || isSending || isMessageEmpty}
            loading={isSending}
            aria-label="Send message"
          >
            <IconSend size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Hidden file input */}
      <FileInput
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept={ALLOWED_FILE_TYPES.join(',')}
      />
    </Box>
  );
};

export default MessageInput;