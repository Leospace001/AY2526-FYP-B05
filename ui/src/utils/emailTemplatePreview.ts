const SAMPLE_DATA: Record<string, Record<string, string>> = {
    forgot_password: {
        name: 'Demo User',
        token: 'sample-reset-token',
        domainUrl: 'http://localhost',
        tokenUrl: 'http://localhost/reset?token=sample-reset-token',
    },
    welcome_registration: {
        name: 'Demo',
        username: 'demo_user',
        domainUrl: 'http://localhost',
        loginUrl: 'http://localhost/login',
    },
};

/** Client-side approximation of Thymeleaf rendering for live admin preview. */
export function renderClientEmailPreview(templateKey: string, html: string): string {
    if (!html.trim()) {
        return '';
    }

    const vars = SAMPLE_DATA[templateKey] ?? {};
    let out = html;

    // th:href="@{ ... }" link expressions (forgot-password template)
    out = out.replace(/\s*th:href="@\{[^"]*\}"/g, () => {
        const href = vars.tokenUrl ?? vars.loginUrl ?? '#';
        return ` href="${href}"`;
    });

    // th:href="${variable}"
    for (const [key, value] of Object.entries(vars)) {
        out = out.replace(
            new RegExp(`\\s*th:href=["']\\$\\{${key}\\}["']`, 'g'),
            ` href="${value}"`,
        );
    }

    // th:text="${variable}" on empty elements, e.g. <span th:text="${name}"></span>
    out = out.replace(
        /(<([a-zA-Z][\w:-]*)[^>]*?)\s*th:text=["']\$\{(\w+)\}["']([^>]*>)(\s*<\/\2>)/g,
        (_match, open, _tag, varName, rest, close) => {
            const value = vars[varName] ?? `\${${varName}}`;
            return `${open}${rest}${value}${close}`;
        },
    );

    // th:text on malformed tags (e.g. <span th:text="${tokenUrl}"></a>)
    out = out.replace(
        /th:text=["']\$\{(\w+)\}["']/g,
        (_match, varName) => {
            const value = vars[varName];
            return value != null ? `>${value}` : '';
        },
    );

    // Strip remaining th: attributes and xmlns
    out = out.replace(/\s+xmlns:th="[^"]*"/g, '');
    out = out.replace(/\s*th:[a-zA-Z-]+="[^"]*"/g, '');

    return out;
}

export function getSampleVariables(templateKey: string): Record<string, string> {
    return SAMPLE_DATA[templateKey] ?? {};
}
