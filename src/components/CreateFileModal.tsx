import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormErrorMessage,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFiles: string[];
  onConfirm: (filename: string, resolution: number) => Promise<void>;
}

export const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  onClose,
  existingFiles,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [filename, setFilename] = useState('');
  const [resolution, setResolution] = useState(256);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate default filename when modal opens
  useEffect(() => {
    if (isOpen) {
      let maxNum = -1;
      const regex = /glyph_E(\d+)\.png$/;
      
      existingFiles.forEach(file => {
        const match = file.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });

      setFilename(`glyph_E${maxNum + 1}`);
      setResolution(256);
      setError('');
    }
  }, [isOpen, existingFiles]);

  const handleResolutionChange = (_: string, value: number) => {
    setResolution(value);
  };

  const validate = () => {
    if (!filename.trim()) {
      setError(t('modal.createFile.error.filenameRequired', 'Filename is required'));
      return false;
    }
    
    // Check if filename already exists (append .png if not present for check)
    const fullFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
    const checkPath = 'font/' + fullFilename;
    if (existingFiles.some(f => f === fullFilename || f.endsWith('/' + fullFilename))) {
       setError(t('modal.createFile.error.filenameExists', 'File already exists'));
       return false;
    }

    if (resolution < 256) {
      setError(t('modal.createFile.error.minResolution', 'Minimum resolution is 256'));
      return false;
    }

    if (resolution % 16 !== 0) {
      setError(t('modal.createFile.error.resolutionMultiple', 'Resolution must be a multiple of 16'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      // Ensure .png extension
      const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
      await onConfirm(finalFilename, resolution);
      onClose();
    } catch (err) {
      console.error(err);
      setError(t('common.error', 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('modal.createFile.title', 'Create New File')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!error}>
              <FormLabel>{t('modal.createFile.filename', 'Filename')}</FormLabel>
              <Input
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  setError('');
                }}
                placeholder="glyph_E?"
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>{t('modal.createFile.resolution', 'Resolution (Width = Height)')}</FormLabel>
              <NumberInput
                value={resolution}
                onChange={handleResolutionChange}
                min={256}
                step={16}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t('modal.createFile.resolutionHint', 'Recommended: 256, 512. Must be multiple of 16.')}
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
            {t('common.create', 'Create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
