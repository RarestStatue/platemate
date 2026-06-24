"use client";

import { IconPlus, IconX, IconChevronDown } from "@tabler/icons-react";
import clsx from "clsx";
import { DIETARY_OPTIONS, SORT_OPTIONS, PREP_TIME_FILTERS } from "@/lib/constants";
import type { DietaryFilters, SortOption, PrepTimeFilter } from "@/lib/types";
import { useState } from "react";

interface FilterPanelProps {
  ingredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  dietaryFilters: DietaryFilters;
  onToggleDietary: (key: string) => void;
  maxPrepTime: PrepTimeFilter;
  onSetPrepTime: (value: PrepTimeFilter) => void;
  sort: SortOption;
  onSetSort: (value: SortOption) => void;
  activeDietaryInfo?: string;
}

export default function FilterPanel({
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  dietaryFilters,
  onToggleDietary,
  maxPrepTime,
  onSetPrepTime,
  sort,
  onSetSort,
  activeDietaryInfo,
}: FilterPanelProps) {
  const [newIngredient, setNewIngredient] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  function handleAddIngredient() {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed.toLowerCase())) {
      onAddIngredient(trimmed.toLowerCase());
      setNewIngredient("");
    }
  }

  return (
    <div className="space-y-4">
      {/* Active dietary info banner */}
      {activeDietaryInfo && (
        <div className="bg-red-light text-red-dark text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <span className="font-medium">{activeDietaryInfo}</span>
        </div>
      )}

      {/* My ingredients */}
      <div>
        <h3 className="text-sm font-semibold mb-2">My ingredients</h3>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing) => (
            <span
              key={ing}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red text-white text-sm rounded-full"
            >
              {ing}
              <button
                onClick={() => onRemoveIngredient(ing)}
                className="hover:bg-red-darker rounded-full p-0.5"
                aria-label={`Remove ${ing}`}
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
              placeholder="Add..."
              className="w-20 text-sm px-2 py-1 border border-dashed border-border rounded-full focus:outline-none focus:border-red"
            />
            <button
              onClick={handleAddIngredient}
              className="text-red hover:text-red-darker"
              aria-label="Add ingredient"
            >
              <IconPlus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Dietary restrictions */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Dietary restrictions</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ key, label }) => {
            const isActive =
              dietaryFilters[key as keyof DietaryFilters] === true;
            return (
              <button
                key={key}
                onClick={() => onToggleDietary(key)}
                className={clsx(
                  "px-3 py-1 text-sm rounded-full border transition-colors",
                  isActive
                    ? "bg-red text-white border-red"
                    : "bg-white text-foreground border-border hover:border-red"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prep time */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Max prep time</h3>
        <div className="flex flex-wrap gap-2">
          {PREP_TIME_FILTERS.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => onSetPrepTime(value)}
              className={clsx(
                "px-3 py-1 text-sm rounded-full border transition-colors",
                maxPrepTime === value
                  ? "bg-red text-white border-red"
                  : "bg-white text-foreground border-border hover:border-red"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="relative">
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
          <IconChevronDown size={16} />
        </button>
        {showSortDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  onSetSort(value as SortOption);
                  setShowSortDropdown(false);
                }}
                className={clsx(
                  "block w-full text-left px-4 py-2 text-sm hover:bg-gray-50",
                  sort === value && "text-red font-medium"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
