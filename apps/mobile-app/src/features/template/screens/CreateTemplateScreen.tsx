import { useMemo } from 'react';

import { TemplateEditor } from '../components/TemplateEditor';
import { createTemplateDay, createTemplateDraftSeed } from '@features/template/utils/template-screen-data';

export default function CreateTemplateScreen() {
    const createTemplateDraft = useMemo(
        () =>
            createTemplateDraftSeed({
                name: '',
                description: '',
                days: [createTemplateDay({ dayNumber: 1 })],
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