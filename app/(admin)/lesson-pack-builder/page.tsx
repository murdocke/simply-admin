'use client';

import { useEffect, useMemo, useState } from 'react';
import LessonPackRenderer from '../components/lesson-pack-renderer';
import {
  emptyLessonPack,
  type LessonPack,
  type LessonPackAudience,
  type LessonPackBlock,
  LESSON_PACKS_KEY,
  loadLessonPacks,
  saveLessonPacks,
} from '../components/lesson-pack-types';

const blockTypeOptions: { label: string; value: LessonPackBlock['type'] }[] = [
  { label: 'Heading', value: 'heading' },
  { label: 'Rich Text', value: 'richText' },
  { label: 'Image', value: 'image' },
  { label: 'PDF', value: 'pdf' },
  { label: 'SoundSlice', value: 'soundSlice' },
  { label: 'External Link', value: 'linkExternal' },
  { label: 'Internal Link', value: 'linkInternal' },
];

const visibilityOptions: LessonPackBlock['visibility'][] = [
  'both',
  'student',
  'teacher',
];

const createBlock = (type: LessonPackBlock['type']): LessonPackBlock => ({
  id: `block-${Math.random().toString(36).slice(2, 10)}`,
  type,
  visibility: 'both',
  order: 0,
  data: {},
});

const updateBlockOrder = (blocks: LessonPackBlock[]) =>
  blocks.map((block, index) => ({ ...block, order: index }));

export default function LessonPackBuilderPage() {
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [audiencePreview, setAudiencePreview] = useState<
    LessonPackAudience | 'both'
  >('student');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockTypeToAdd, setBlockTypeToAdd] =
    useState<LessonPackBlock['type']>('heading');

  useEffect(() => {
    const stored = loadLessonPacks();
    if (stored.length > 0) {
      setPacks(stored);
      setActivePackId(stored[0].id);
      return;
    }
    const starter = emptyLessonPack();
    setPacks([starter]);
    setActivePackId(starter.id);
    saveLessonPacks([starter]);
  }, []);

  const activePack = useMemo(
    () => packs.find(pack => pack.id === activePackId) ?? null,
    [packs, activePackId],
  );

  const updatePacks = (nextPacks: LessonPack[]) => {
    setPacks(nextPacks);
    saveLessonPacks(nextPacks);
  };

  const updateActivePack = (updater: (pack: LessonPack) => LessonPack) => {
    if (!activePack) return;
    const nextPacks = packs.map(pack =>
      pack.id === activePack.id ? updater(pack) : pack,
    );
    updatePacks(nextPacks);
  };

  const handleMetaChange = (field: keyof LessonPack, value: string) => {
    updateActivePack(pack => ({
      ...pack,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSaveStatus = (status: LessonPack['status']) => {
    updateActivePack(pack => ({
      ...pack,
      status,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddBlock = () => {
    updateActivePack(pack => {
      const nextBlocks = updateBlockOrder([
        ...pack.blocks,
        { ...createBlock(blockTypeToAdd), order: pack.blocks.length },
      ]);
      return { ...pack, blocks: nextBlocks, updatedAt: new Date().toISOString() };
    });
  };

  const handleBlockUpdate = (blockId: string, data: Partial<LessonPackBlock>) => {
    updateActivePack(pack => ({
      ...pack,
      blocks: pack.blocks.map(block =>
        block.id === blockId ? { ...block, ...data } : block,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    updateActivePack(pack => {
      const index = pack.blocks.findIndex(block => block.id === blockId);
      if (index < 0) return pack;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= pack.blocks.length) return pack;
      const nextBlocks = [...pack.blocks];
      const [moved] = nextBlocks.splice(index, 1);
      nextBlocks.splice(nextIndex, 0, moved);
      return {
        ...pack,
        blocks: updateBlockOrder(nextBlocks),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    updateActivePack(pack => ({
      ...pack,
      blocks: updateBlockOrder(pack.blocks.filter(block => block.id !== blockId)),
      updatedAt: new Date().toISOString(),
    }));
    setSelectedBlockId(null);
  };

  const handleNewPack = () => {
    const next = emptyLessonPack();
    updatePacks([next, ...packs]);
    setActivePackId(next.id);
    setSelectedBlockId(null);
  };

  const handleDuplicatePack = () => {
    if (!activePack) return;
    const now = new Date().toISOString();
    const duplicate: LessonPack = {
      ...activePack,
      id: `pack-${Math.random().toString(36).slice(2, 10)}`,
      title: `${activePack.title} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    updatePacks([duplicate, ...packs]);
    setActivePackId(duplicate.id);
  };

  const handleExport = async () => {
    if (!activePack) return;
    const payload = JSON.stringify(activePack, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      alert('Lesson pack JSON copied to clipboard.');
    } catch {
      alert(payload);
    }
  };

  const handleImport = () => {
    const raw = window.prompt('Paste lesson pack JSON');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LessonPack;
      if (!parsed?.id) throw new Error('Invalid pack');
      updatePacks([parsed, ...packs.filter(pack => pack.id !== parsed.id)]);
      setActivePackId(parsed.id);
    } catch {
      alert('Invalid JSON. Please paste a valid lesson pack.');
    }
  };

  const selectedBlock = activePack?.blocks.find(
    block => block.id === selectedBlockId,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <input
            className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-xl font-semibold text-[var(--c-1f1f1d)]"
            value={activePack?.title ?? ''}
            onChange={event => handleMetaChange('title', event.target.value)}
            placeholder="Lesson pack title"
          />
          <input
            className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-6f6c65)]"
            value={activePack?.subtitle ?? ''}
            onChange={event => handleMetaChange('subtitle', event.target.value)}
            placeholder="Subtitle (optional)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activePack?.id ?? ''}
            onChange={event => setActivePackId(event.target.value)}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            {packs.map(pack => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-1">
            {(['student', 'teacher', 'both'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setAudiencePreview(option)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  audiencePreview === option
                    ? 'bg-[var(--c-c8102e)] text-white'
                    : 'text-[var(--c-6f6c65)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleSaveStatus('draft')}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveStatus('published')}
            className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={handleDuplicatePack}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleNewPack}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            New Pack
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Import JSON
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          {activePack ? (
            <>
              {audiencePreview === 'both' ? (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                      Student Preview
                    </p>
                    <div className="mt-4">
                      <LessonPackRenderer
                        lessonPack={activePack}
                        audience="student"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                      Teacher Preview
                    </p>
                    <div className="mt-4">
                      <LessonPackRenderer
                        lessonPack={activePack}
                        audience="teacher"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <LessonPackRenderer
                  lessonPack={activePack}
                  audience={audiencePreview}
                />
              )}
            </>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Blocks
            </p>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={blockTypeToAdd}
                onChange={event =>
                  setBlockTypeToAdd(event.target.value as LessonPackBlock['type'])
                }
                className="flex-1 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                {blockTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddBlock}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Add
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {activePack?.blocks.length ? (
                activePack.blocks
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(block => (
                    <div
                      key={block.id}
                      className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                        selectedBlockId === block.id
                          ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-1f1f1d)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          {block.type}
                        </button>
                        <span className="rounded-full border border-[var(--c-ecebe7)] px-2 py-0.5 text-[10px]">
                          {block.visibility}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, 'up')}
                          className="rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-[10px]"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, 'down')}
                          className="rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-[10px]"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="ml-auto rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-[var(--c-6f6c65)]">
                  Add blocks to start building.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              {selectedBlock ? 'Block Settings' : 'Pack Settings'}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {selectedBlock ? (
                <>
                  <label className="flex flex-col gap-2">
                    Visibility
                    <select
                      value={selectedBlock.visibility}
                      onChange={event =>
                        handleBlockUpdate(selectedBlock.id, {
                          visibility: event.target.value as LessonPackBlock['visibility'],
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {visibilityOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedBlock.type === 'heading' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        Text
                        <input
                          value={(selectedBlock.data as { text?: string }).text ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                text: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Level (1-4)
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={(selectedBlock.data as { level?: number }).level ?? 2}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                level: Number(event.target.value),
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === 'richText' ? (
                    <label className="flex flex-col gap-2">
                      Markdown
                      <textarea
                        value={
                          (selectedBlock.data as { markdown?: string }).markdown ?? ''
                        }
                        onChange={event =>
                          handleBlockUpdate(selectedBlock.id, {
                            data: {
                              ...(selectedBlock.data as object),
                              markdown: event.target.value,
                            },
                          })
                        }
                        className="min-h-[120px] rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      />
                    </label>
                  ) : null}

                  {selectedBlock.type === 'image' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        Image URL
                        <input
                          value={(selectedBlock.data as { uri?: string }).uri ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                uri: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Caption
                        <input
                          value={
                            (selectedBlock.data as { caption?: string }).caption ?? ''
                          }
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                caption: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === 'pdf' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        PDF URL
                        <input
                          value={(selectedBlock.data as { uri?: string }).uri ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                uri: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Title
                        <input
                          value={(selectedBlock.data as { title?: string }).title ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                title: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Display Mode
                        <select
                          value={
                            (selectedBlock.data as { displayMode?: string })
                              .displayMode ?? 'inline'
                          }
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                displayMode: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        >
                          <option value="inline">Inline</option>
                          <option value="link">Link</option>
                        </select>
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === 'soundSlice' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        Embed URL
                        <input
                          value={(selectedBlock.data as { url?: string }).url ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                url: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Title
                        <input
                          value={(selectedBlock.data as { title?: string }).title ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                title: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Height
                        <input
                          type="number"
                          value={
                            (selectedBlock.data as { height?: number }).height ?? 360
                          }
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                height: Number(event.target.value),
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === 'linkExternal' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        Label
                        <input
                          value={(selectedBlock.data as { label?: string }).label ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                label: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        URL
                        <input
                          value={(selectedBlock.data as { url?: string }).url ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                url: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === 'linkInternal' ? (
                    <>
                      <label className="flex flex-col gap-2">
                        Label
                        <input
                          value={(selectedBlock.data as { label?: string }).label ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                label: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        Route
                        <input
                          value={(selectedBlock.data as { route?: string }).route ?? ''}
                          onChange={event =>
                            handleBlockUpdate(selectedBlock.id, {
                              data: {
                                ...(selectedBlock.data as object),
                                route: event.target.value,
                              },
                            })
                          }
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-2">
                    Description
                    <textarea
                      value={activePack?.description ?? ''}
                      onChange={event =>
                        handleMetaChange('description', event.target.value)
                      }
                      className="min-h-[120px] rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    Cover Image URL
                    <input
                      value={activePack?.coverImage ?? ''}
                      onChange={event =>
                        handleMetaChange('coverImage', event.target.value)
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    Tags (comma separated)
                    <input
                      value={(activePack?.tags ?? []).join(', ')}
                      onChange={event =>
                        updateActivePack(pack => ({
                          ...pack,
                          tags: event.target.value
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(Boolean),
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
