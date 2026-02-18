import { 
  Box, Flex, Container, Heading, Spacer, 
  Menu, MenuButton, MenuList, MenuItem, Button, 
  useColorMode, Icon 
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { FaSun, FaMoon, FaGlobe, FaChevronDown } from 'react-icons/fa';

export function Layout() {
  const { colorMode, setColorMode } = useColorMode();
  const { i18n, t } = useTranslation();

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Box bg={colorMode === 'light' ? 'white' : 'gray.800'} shadow="sm">
        <Container maxW="full" px={8}>
          <Flex h={16} alignItems="center">
            <RouterLink to="/">
              <Heading size="md">MCBE Glyph Painter</Heading>
            </RouterLink>
            <Spacer />
            
            <Menu>
              <MenuButton 
                as={Button} 
                leftIcon={<Icon as={FaGlobe} />} 
                rightIcon={<Icon as={FaChevronDown} boxSize={3} />} 
                variant="ghost" 
                size="sm"
                mr={2}
              >
                {i18n.language === 'en' ? 'English' : '中文'}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => i18n.changeLanguage('en')}>English</MenuItem>
                <MenuItem onClick={() => i18n.changeLanguage('zh')}>中文</MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton 
                as={Button} 
                leftIcon={<Icon as={colorMode === 'light' ? FaSun : FaMoon} />} 
                rightIcon={<Icon as={FaChevronDown} boxSize={3} />} 
                variant="ghost" 
                size="sm"
              >
                {t(`theme.${colorMode}`)}
              </MenuButton>
              <MenuList>
                <MenuItem icon={<Icon as={FaSun} />} onClick={() => setColorMode('light')}>
                  {t('theme.light')}
                </MenuItem>
                <MenuItem icon={<Icon as={FaMoon} />} onClick={() => setColorMode('dark')}>
                  {t('theme.dark')}
                </MenuItem>
                <MenuItem icon={<Icon as={FaSun} opacity={0.5} />} onClick={() => setColorMode('system')}>
                  {t('theme.system')}
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Container>
      </Box>

      <Box py={8}>
        <Outlet />
      </Box>
    </Box>
  );
}
