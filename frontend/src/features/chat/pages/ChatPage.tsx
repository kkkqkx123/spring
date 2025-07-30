import React from 'react';
import { Container, Card } from '@mantine/core';
import { ChatInterface } from '../components/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <Container size="xl" py="xl" style={{ height: 'calc(100vh - 120px)' }}>
      <Card 
        padding={0} 
        radius="md" 
        withBorder 
        style={{ height: '100%', overflow: 'hidden' }}
      >
        <ChatInterface />
      </Card>
    </Container>
  );
};

export default ChatPage;