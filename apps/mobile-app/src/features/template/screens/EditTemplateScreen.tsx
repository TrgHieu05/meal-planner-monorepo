import { useMemo } from 'react';

import { TemplateEditor } from '../components/TemplateEditor';
import { createTemplateDraftSeed } from '@features/template/utils/template-screen-data';

export default function EditTemplateScreen() {
    const editTemplateDraft = useMemo(() => createTemplateDraftSeed(), []);

    return (
        <TemplateEditor
            headerTitle="Edit Template"
            submitLabel="Save"
            quitModalVariant="edit"
            initialTemplateName={editTemplateDraft.name}
            initialDescription={editTemplateDraft.description}
            initialDays={editTemplateDraft.days}
        />
    );
}