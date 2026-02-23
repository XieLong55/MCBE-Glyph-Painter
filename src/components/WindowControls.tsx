import { HStack, IconButton, Icon, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';

export function WindowControls() {
    const [isTauri, setIsTauri] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
    const closeHoverBg = '#e81123';
    const closeHoverColor = 'white';

    useEffect(() => {
        // Check if we are running in Tauri
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            setIsTauri(true);

            // Dynamic import to avoid SSR/Web issues
            import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                const appWindow = getCurrentWindow();

                const updateMaximized = async () => {
                    const maximized = await appWindow.isMaximized();
                    setIsMaximized(maximized);
                };

                updateMaximized();

                // Listen for resize events to update maximized state
                const unlisten = appWindow.onResized(() => {
                    updateMaximized();
                });

                return () => {
                    unlisten.then(u => u());
                };
            });
        }
    }, []);

    if (!isTauri) return null;

    const handleMinimize = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
    };

    const handleMaximize = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
    };

    const handleClose = async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
    };

    return (
        <HStack spacing={0} h="100%" align="stretch" position="relative" zIndex={2000}>
            <IconButton
                aria-label="Minimize"
                icon={<Icon as={VscChromeMinimize} />}
                variant="ghost"
                borderRadius={0}
                h="100%"
                w="46px"
                _hover={{ bg: hoverBg }}
                onClick={handleMinimize}
                fontSize="12px"
            />
            <IconButton
                aria-label={isMaximized ? "Restore" : "Maximize"}
                icon={<Icon as={isMaximized ? VscChromeRestore : VscChromeMaximize} />}
                variant="ghost"
                borderRadius={0}
                h="100%"
                w="46px"
                _hover={{ bg: hoverBg }}
                onClick={handleMaximize}
                fontSize="12px"
            />
            <IconButton
                aria-label="Close"
                icon={<Icon as={VscChromeClose} />}
                variant="ghost"
                borderRadius={0}
                h="100%"
                w="46px"
                _hover={{ bg: closeHoverBg, color: closeHoverColor }}
                onClick={handleClose}
                fontSize="12px"
            />
        </HStack>
    );
}
