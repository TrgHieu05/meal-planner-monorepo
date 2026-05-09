import { useMemo } from 'react';

import { TemplateEditor } from '../components/TemplateEditor';
import { createTemplateDraftSeed } from '@features/template/utils/template-screen-data';

export default function CreateTemplateScreen() {
    const createTemplateDraft = useMemo(
        () =>
            createTemplateDraftSeed({
                name: '',
                description: '',
            }),
        [],
    );

    return (
        <TemplateEditor
            headerTitle="Create Template"
            submitLabel="Create"
            quitModalVariant="create"
            initialTemplateName={createTemplateDraft.name}
            initialDescription={createTemplateDraft.description}
            initialDays={createTemplateDraft.days}
        />
    );
}