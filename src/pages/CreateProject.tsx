import { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Textarea, VStack, useToast, HStack, Grid, GridItem, Divider, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { createNewProject } from '../utils/project';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function CreateProject() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('create.title');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [version, setVersion] = useState<string>('1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const versionParts = version.split('.').map(Number);
      if (versionParts.length !== 3 || versionParts.some(isNaN)) {
        throw new Error('Invalid version format. Use x.y.z');
      }

      await createNewProject(
        name,
        description,
        versionParts as [number, number, number],
        moduleDescription || description
      );

      toast({
        title: t('common.success'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/projects');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="full" px={8} py={8} h="full">
      <Heading mb={8} textAlign="center">{t('create.title')}</Heading>
      <Box as="form" onSubmit={handleSubmit} bg="white" _dark={{ bg: 'gray.800' }} p={8} borderRadius="lg" shadow="sm" w="full">
        <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={8} w="full">
          <GridItem>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="blue.500">{t('create.header_info')}</Heading>
              <Text fontSize="sm" color="gray.500">{t('create.header_info_desc')}</Text>
              
              <FormControl isRequired>
                <FormLabel>{t('create.name')}</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., My Awesome Pack"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('create.description')}</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your resource pack..."
                  minH="120px"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{t('create.version')}</FormLabel>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </FormControl>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="purple.500">{t('create.module_info')}</Heading>
              <Text fontSize="sm" color="gray.500">{t('create.module_info_desc')}</Text>

              <FormControl>
                <FormLabel>{t('create.module_desc')}</FormLabel>
                <Textarea
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder={t('create.module_desc_placeholder')}
                  minH="120px"
                />
              </FormControl>
              
              <Box p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">
                <Text fontSize="sm" color="gray.500">
                  <Text as="span" fontWeight="bold">{t('create.note')}</Text> {t('create.uuid_note')}
                </Text>
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        <Divider my={8} />

        <HStack width="full" spacing={4} justify="flex-end">
          <Button
            variant="ghost"
            as={RouterLink}
            to="/projects"
            isDisabled={isSubmitting}
            size="lg"
          >
            {t('create.cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            size="lg"
            px={8}
          >
            {t('create.submit')}
          </Button>
        </HStack>
      </Box>
    </Container>
  );
}
