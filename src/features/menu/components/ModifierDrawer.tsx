"use client";

import { MenuItem, MenuOptionGroup, SelectedMap } from "@/features/menu/types";

export default function ModifierDrawer({
  item,
  selected,
  onSelect,
  onClose,
  onConfirm
}: {
  item: MenuItem;
  selected: SelectedMap;
  onSelect: (value: SelectedMap) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const groups = item.modifierGroups ?? [];
  const totalPrice = calculateModifierTotal(item, selected);
  const missingRequired = groups.some((group) => {
    const count = selected[group.id]?.length ?? 0;
    const minSelect = group.required ? Math.max(1, group.minSelect) : group.minSelect;
    return count < minSelect;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/50 px-4 pb-6 pt-10 transition-opacity">
      <div className="w-full max-w-2xl rounded-2xl bg-brand-rice shadow-crisp">
        <div className="flex items-center justify-between border-b border-brand-ink/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">Customize</p>
            <h3 className="text-lg font-semibold text-brand-ink">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-brand-ink/10 px-3 py-1 text-xs font-semibold text-brand-ink"
          >
            Close
          </button>
        </div>
        <div className="space-y-5 p-6">
          {groups.map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-brand-ink">
                <span>{group.name}</span>
                <span className="text-xs text-brand-ink/60">
                  {group.minSelect}-{group.maxSelect}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => {
                  const selectedIds = selected[group.id] ?? [];
                  const checked = selectedIds.includes(option.id);
                  const optionCurrency = option.currency ?? item.currency;

                  return (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-brand-ink bg-brand-ink text-brand-rice"
                          : "border-brand-ink/10 text-brand-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            handleSelect({
                              groupId: group.id,
                              optionId: option.id,
                              checked: event.target.checked,
                              selected,
                              group,
                              onSelect
                            })
                          }
                        />
                        <span>{option.name}</span>
                      </div>
                      {option.priceMinor ? (
                        <span className="text-xs">
                          +{formatCurrency(option.priceMinor, optionCurrency)}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-brand-ink/10 pt-4">
            <p className="text-sm font-semibold text-brand-ink">
              Total: {formatCurrency(totalPrice, item.currency)}
            </p>
            <button
              onClick={onConfirm}
              disabled={missingRequired}
              className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function handleSelect(params: {
  groupId: string;
  optionId: string;
  checked: boolean;
  selected: SelectedMap;
  group: MenuOptionGroup;
  onSelect: (value: SelectedMap) => void;
}) {
  const { groupId, optionId, checked, selected, group, onSelect } = params;
  const next = { ...selected };
  const current = next[groupId] ? [...next[groupId]] : [];

  if (checked) {
    if (current.length >= group.maxSelect) return;
    current.push(optionId);
  } else {
    const index = current.indexOf(optionId);
    if (index >= 0) current.splice(index, 1);
  }

  next[groupId] = current;
  onSelect(next);
}

function calculateModifierTotal(item: MenuItem, selected: SelectedMap) {
  const base = item.priceMinor ?? 0;
  const additional = Object.values(selected)
    .flat()
    .reduce((sum, optionId) => {
      const option = item.modifierGroups
        ?.flatMap((group) => group.options)
        .find((entry) => entry.id === optionId);
      return sum + (option?.priceMinor ?? 0);
    }, 0);

  return base + additional;
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}
