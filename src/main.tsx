import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/global.css';

Sentry.init({
    dsn: 'https://3455cd727c3b8efa05d05a03201b83f1@o4512164086153216.ingest.us.sentry.io/4512164125343744',
    enabled:
        import.meta.env.PROD &&
        window.location.hostname === 'planit-ai.site',
    environment: 'production',
});

if (
    import.meta.env.PROD &&
    window.location.hostname === 'planit-ai.site'
) {
    window.addEventListener(
        'planit:sentry-test',
        () => {
            throw new Error('PlanIt production Sentry verification');
        },
        { once: true },
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);