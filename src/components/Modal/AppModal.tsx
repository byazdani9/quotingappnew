import React from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Portal, Card, Title, Provider } from 'react-native-paper';

interface AppModalProps {
  isVisible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * A reusable modal component based on react-native-paper.
 * Wraps content in a Card inside the modal.
 *
 * @param {boolean} isVisible Controls modal visibility.
 * @param {function} onDismiss Function called when the modal is dismissed (e.g., tapping outside).
 * @param {string} [title] Optional title displayed at the top of the modal card.
 * @param {React.ReactNode} children The content to display inside the modal.
 */
const AppModal: React.FC<AppModalProps> = ({
  isVisible,
  onDismiss,
  title,
  children,
}) => {
  return (
    // Removed the nested <Provider> as App.tsx likely already has one.
    // Rely on the top-level PaperProvider.
    <Portal>
      <Modal
        visible={isVisible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.card}>
            {title && (
              <Card.Title title={title} titleStyle={styles.title} />
            )}
            <Card.Content>
              {children}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    // </Provider> // Removed Provider closing tag
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    // Center the modal - adjust padding as needed
    padding: 20,
    margin: 20, // Add margin to avoid touching screen edges
  },
  card: {
    // Style the card container
    padding: 10, // Add some internal padding
  },
  title: {
    // Style the title if needed
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AppModal;
