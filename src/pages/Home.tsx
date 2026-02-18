import { Button, Container, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { FaArrowRight } from 'react-icons/fa';

export function Home() {
  const { t } = useTranslation();
  useDocumentTitle('home.welcome');

  return (
    <Container maxW="full" px={8} py={20}>
      <VStack spacing={8} textAlign="center" w="full">
        <Heading as="h1" size="2xl" bgGradient="linear(to-l, #7928CA, #FF0080)" bgClip="text">
          MCBE Glyph Painter
        </Heading>
        <Text fontSize="xl" color="gray.500">
          {t('home.welcome')}
        </Text>
        {/* Button removed as per user request to delete all functions jumping to home, 
            but user also said 'delete all functions jumping TO home'. 
            This button jumps FROM home TO projects. 
            User said "Home has display purpose".
            So we keep the button to let them ENTER the app.
        */}
        <Button
          as={RouterLink}
          to="/projects"
          size="lg"
          colorScheme="purple"
          rightIcon={<Icon as={FaArrowRight} />}
        >
          {t('home.get_started')}
        </Button>
      </VStack>
    </Container>
  );
}
