import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useDocumentTitle(titleKey: string) {
  const { t } = useTranslation();

  useEffect(() => {
    const appName = t('app.title');
    const pageTitle = t(titleKey);
    document.title = `${pageTitle} - ${appName}`;
  }, [titleKey, t]);
}
