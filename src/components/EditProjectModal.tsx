import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Textarea, VStack, HStack, IconButton, useToast,
  Tabs, TabList, TabPanels, Tab, TabPanel, Text, Badge, Grid, GridItem, Icon
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FaSync, FaSave } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../utils/storage';
import type { Project, Manifest } from '../types';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [saving, setSaving] = useState(false);

  // Load manifest when modal opens
  useEffect(() => {
    const loadManifest = async () => {
      try {
        let content = await StorageService.getFile(project.uuid, 'manifest.json');
        
        if (content instanceof Blob) {
          content = await content.text();
        }

        if (content && typeof content === 'string') {
          setManifest(JSON.parse(content));
        } else {
          throw new Error('Manifest not found or invalid');
        }
      } catch (error) {
        console.error(error);
        toast({
          title: t('common.error'),
          description: 'Failed to load manifest.json',
          status: 'error',
        });
        onClose();
      }
    };

    if (isOpen && project) {
      loadManifest();
    }
  }, [isOpen, project, t, toast, onClose]);

  const handleSave = async () => {
    if (!manifest) return;
    setSaving(true);
    try {
      // 1. Save manifest.json
      await StorageService.saveFile(
        project.uuid,
        'manifest.json',
        JSON.stringify(manifest, null, 2)
      );

      // 2. Update Project metadata
      // Note: We keep the original project UUID as the storage key, even if manifest UUID changed.
      const updatedProject: Project = {
        ...project,
        name: manifest.header.name,
        description: manifest.header.description,
        version: manifest.header.version,
        header_description: manifest.header.description,
        modules_description: manifest.modules?.[0]?.description || '',
        updated_at: Date.now()
      };

      await StorageService.saveProject(updatedProject);

      toast({
        title: t('common.success'),
        status: 'success',
      });
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: t('common.error'),
        description: 'Failed to save changes',
        status: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHeader = (field: string, value: string | number[]) => {
    if (!manifest) return;
    setManifest({
      ...manifest,
      header: { ...manifest.header, [field]: value }
    });
  };

  const updateModule = (index: number, field: string, value: string | number[]) => {
    if (!manifest || !manifest.modules[index]) return;
    const newModules = [...manifest.modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setManifest({ ...manifest, modules: newModules });
  };

  const refreshUuid = (target: 'header' | 'module', index: number = 0) => {
    const newUuid = uuidv4();
    if (target === 'header') {
      updateHeader('uuid', newUuid);
    } else {
      updateModule(index, 'uuid', newUuid);
    }
  };

  const updateVersion = (target: 'header' | 'module', index: number = 0, value: string) => {
    const parts = value.split('.').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      if (target === 'header') {
        updateHeader('version', parts);
      } else {
        updateModule(index, 'version', parts);
      }
    }
  };

  if (!manifest) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('project.edit_manifest')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="enclosed">
            <TabList>
              <Tab>{t('create.header_info')}</Tab>
              <Tab>{t('create.module_info')}</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{t('create.name')}</FormLabel>
                    <Input 
                      value={manifest.header.name} 
                      onChange={(e) => updateHeader('name', e.target.value)} 
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('create.description')}</FormLabel>
                    <Textarea 
                      value={manifest.header.description} 
                      onChange={(e) => updateHeader('description', e.target.value)} 
                    />
                  </FormControl>

                  <Grid templateColumns="1fr 1fr" gap={4} w="full">
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>{t('create.version')}</FormLabel>
                        <Input 
                          defaultValue={manifest.header.version.join('.')} 
                          onBlur={(e) => updateVersion('header', 0, e.target.value)}
                          placeholder="x.y.z"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                       {/* Min Engine Version could go here */}
                    </GridItem>
                  </Grid>

                  <FormControl>
                    <FormLabel>UUID</FormLabel>
                    <HStack>
                      <Input 
                        value={manifest.header.uuid} 
                        isReadOnly 
                        fontFamily="monospace" 
                        fontSize="sm" 
                        bg="gray.50" 
                        _dark={{ bg: 'gray.700' }}
                      />
                      <IconButton 
                        aria-label="Refresh UUID" 
                        icon={<Icon as={FaSync} />} 
                        onClick={() => refreshUuid('header')}
                      />
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={1}>{t('create.uuid_note')}</Text>
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                {manifest.modules.map((module, index) => (
                  <VStack key={index} spacing={4} align="stretch" p={4} borderWidth="1px" borderRadius="md" mb={4}>
                    <Badge colorScheme="blue" alignSelf="start">{module.type}</Badge>
                    
                    <FormControl>
                      <FormLabel>{t('create.description')}</FormLabel>
                      <Textarea 
                        value={module.description} 
                        onChange={(e) => updateModule(index, 'description', e.target.value)} 
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>{t('create.version')}</FormLabel>
                      <Input 
                        defaultValue={module.version.join('.')} 
                        onBlur={(e) => updateVersion('module', index, e.target.value)}
                        placeholder="x.y.z"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>UUID</FormLabel>
                      <HStack>
                        <Input 
                          value={module.uuid} 
                          isReadOnly 
                          fontFamily="monospace" 
                          fontSize="sm"
                          bg="gray.50" 
                          _dark={{ bg: 'gray.700' }}
                        />
                        <IconButton 
                          aria-label="Refresh UUID" 
                          icon={<Icon as={FaSync} />} 
                          onClick={() => refreshUuid('module', index)}
                        />
                      </HStack>
                    </FormControl>
                  </VStack>
                ))}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('create.cancel')}
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={saving} leftIcon={<Icon as={FaSave} />}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
