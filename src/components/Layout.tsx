import {
  Box, Flex, Container, Heading, Spacer, IconButton, Icon,
  Menu, MenuButton, MenuList, MenuItem, useColorMode,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure,
  VStack, HStack, useBreakpointValue, Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { FaSun, FaMoon, FaGlobe, FaBars, FaHome, FaFolder } from 'react-icons/fa';

function ButtonLink({ to, icon, label, onClick, isActive }: { to: string, icon: React.ElementType, label: string, onClick?: () => void, isActive?: boolean }) {
  return (
    <RouterLink to={to} onClick={onClick}>
      <HStack 
        spacing={3} 
        px={4} 
        py={2} 
        borderRadius="md" 
        bg={isActive ? 'blue.50' : 'transparent'} 
        color={isActive ? 'blue.600' : 'inherit'}
        _dark={{ 
          bg: isActive ? 'blue.900' : 'transparent',
          color: isActive ? 'blue.200' : 'inherit'
        }}
        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
        transition="all 0.2s"
      >
        <Icon as={icon} />
        <Text fontWeight="medium">{label}</Text>
      </HStack>
    </RouterLink>
  );
}

const NavContent = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      <ButtonLink to="/" icon={FaHome} label={t('nav.home')} onClick={onClose} isActive={location.pathname === '/'} />
      <ButtonLink to="/projects" icon={FaFolder} label={t('nav.projects')} onClick={onClose} isActive={location.pathname.startsWith('/projects')} />
    </>
  );
};

const SettingsContent = () => {
  const { t, i18n } = useTranslation();
  const { colorMode, setColorMode } = useColorMode();
  
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <Menu>
        <MenuButton as={IconButton} icon={<Icon as={FaGlobe} />} variant="ghost" aria-label="Language" />
        <MenuList>
          <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
          <MenuItem onClick={() => changeLanguage('zh')}>中文</MenuItem>
        </MenuList>
      </Menu>

      <Menu>
        <MenuButton as={IconButton} icon={<Icon as={colorMode === 'light' ? FaSun : FaMoon} />} variant="ghost" aria-label="Theme" />
        <MenuList>
          <MenuItem icon={<Icon as={FaSun} />} onClick={() => setColorMode('light')}>{t('theme.light')}</MenuItem>
          <MenuItem icon={<Icon as={FaMoon} />} onClick={() => setColorMode('dark')}>{t('theme.dark')}</MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};

export function Layout() {
  const { colorMode, setColorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Box bg={colorMode === 'light' ? 'white' : 'gray.800'} shadow="sm" position="sticky" top={0} zIndex={1000}>
        <Container maxW="full" px={8}>
          <Flex h={16} alignItems="center">
            {isMobile && (
              <IconButton
                icon={<Icon as={FaBars} />}
                variant="ghost"
                onClick={onOpen}
                aria-label="Menu"
                mr={4}
              />
            )}
            
            <RouterLink to="/">
              <Heading size="md" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                MCBE Glyph Painter
              </Heading>
            </RouterLink>
            
            <Spacer />
            
            {!isMobile && (
              <HStack spacing={4}>
                <NavContent onClose={onClose} />
                <Box h="24px" w="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} mx={2} />
                <SettingsContent />
              </HStack>
            )}
          </Flex>
        </Container>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4} mt={4}>
              <NavContent onClose={onClose} />
              <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} my={2} />
              <HStack justify="space-between" px={4}>
                <Text fontWeight="medium">{t('settings.language')}</Text>
                <Menu>
                  <MenuButton as={IconButton} icon={<Icon as={FaGlobe} />} size="sm" variant="ghost" />
                  <MenuList>
                    <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('zh')}>中文</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
              <HStack justify="space-between" px={4}>
                <Text fontWeight="medium">{t('settings.theme')}</Text>
                 <Menu>
                  <MenuButton as={IconButton} icon={<Icon as={colorMode === 'light' ? FaSun : FaMoon} />} size="sm" variant="ghost" />
                  <MenuList>
                    <MenuItem icon={<Icon as={FaSun} />} onClick={() => setColorMode('light')}>{t('theme.light')}</MenuItem>
                    <MenuItem icon={<Icon as={FaMoon} />} onClick={() => setColorMode('dark')}>{t('theme.dark')}</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box py={8}>
        <Outlet />
      </Box>
    </Box>
  );
}
