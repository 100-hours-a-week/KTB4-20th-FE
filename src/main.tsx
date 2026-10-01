import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/global.css';

Sentry.init({
    dsn: 'https://59a4527b8854a770e5aaf8ad6f85e6c0@o4512170174382080.ingest.us.sentry.io/4512172554977280',
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