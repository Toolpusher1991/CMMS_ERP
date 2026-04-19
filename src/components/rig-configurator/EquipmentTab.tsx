import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  ClipboardList,
  Package,
  Wrench,
  Droplets,
  Zap,
  Users,
  Shield,
  Settings,
  AlertCircle,
  Truck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { EquipmentCatalog } from "@/data/equipment-catalog";
import type { EquipmentItem } from "./types";

// Icon mapping for equipment categories
const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  drillPipe: Wrench,
  tanks: Droplets,
  power: Zap,
  camps: Users,
  safety: Shield,
  mud: Settings,
  bop: AlertCircle,
  cranes: Truck,
  misc: Package,
};

interface EquipmentTabProps {
  equipmentCategories: EquipmentCatalog;
  selectedEquipment: Record<string, EquipmentItem[]>;
  onToggleEquipment: (category: string, item: EquipmentItem) => void;
  onAddEquipment: (category: string) => void;
  onEditEquipment: (category: string, item: EquipmentItem) => void;
  onDeleteEquipment: (category: string, itemId: string) => void;
  onQuickAction: (categoryKey: string, item: EquipmentItem) => void;
  onBack: () => void;
  onNext: () => void;
}

export function EquipmentTab({
  equipmentCategories,
  selectedEquipment,
  onToggleEquipment,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onQuickAction,
  onBack,
  onNext,
}: EquipmentTabProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () =>
      Object.keys(equipmentCategories).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {},
      ),
  );

  const totalSelected = Object.values(selectedEquipment).flat().length;
  const totalEquipmentCost = Object.values(selectedEquipment)
    .flat()
    .reduce((sum, item) => sum + parseFloat(item.price), 0);

  return (
    <div className="space-y-5">
      {/* Summary bar — H&P style */}
      <div className="bg-[#143269] rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
              Ausgewählt
            </p>
            <p className="text-xl font-bold text-white">
              {totalSelected} Positionen
            </p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
              Equipment-Kosten
            </p>
            <p className="text-xl font-bold text-[#24C26B]">
              € {totalEquipmentCost.toLocaleString("de-DE")}/Tag
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const allOpen = Object.values(openCategories).every(Boolean);
            setOpenCategories(
              Object.keys(equipmentCategories).reduce(
                (acc, key) => ({ ...acc, [key]: !allOpen }),
                {},
              ),
            );
          }}
          className="text-xs font-semibold text-white/80 hover:text-white border border-white/30 rounded-lg px-3 py-1.5 transition-colors"
        >
          {Object.values(openCategories).every(Boolean)
            ? "Alle zuklappen"
            : "Alle aufklappen"}
        </button>
      </div>

      {/* Equipment categories */}
      <div className="space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
        {Object.entries(equipmentCategories).map(([key, category]) => {
          const Icon = CATEGORY_ICONS[key] || Package;
          const selected = selectedEquipment[key] || [];
          const isOpen = openCategories[key] ?? true;
          const categoryTotal = selected.reduce(
            (sum, item) => sum + parseFloat(item.price),
            0,
          );

          return (
            <div
              key={key}
              className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
            >
              {/* Category header */}
              <button
                onClick={() =>
                  setOpenCategories((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#143269] to-[#2B5597] hover:from-[#1a3d7a] hover:to-[#3366aa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-white/60">
                      {category.items.length} verfügbar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selected.length > 0 && (
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 bg-[#24C26B] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        {selected.length}
                      </span>
                      <span className="text-sm font-bold text-[#24C26B]">
                        € {categoryTotal.toLocaleString("de-DE")}
                      </span>
                    </div>
                  )}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEquipment(key);
                    }}
                    className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Collapsible items */}
              {isOpen && (
                <div className="p-4 bg-[#f7f9fc]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {category.items.map((item) => {
                      const isSelected = selected.some((s) => s.id === item.id);
                      const specs = Object.entries(item)
                        .filter(
                          ([k]) => k !== "id" && k !== "name" && k !== "price",
                        )
                        .map(([, value]) => value)
                        .join(" · ");

                      return (
                        <div
                          key={item.id}
                          onClick={() => onToggleEquipment(key, item)}
                          className={`group relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-white border-[#24C26B] shadow-md ring-1 ring-[#24C26B]/20"
                              : "bg-white border-transparent hover:border-[#2B5597]/30 hover:shadow-md shadow-sm"
                          }`}
                        >
                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 rounded-full bg-[#24C26B] flex items-center justify-center">
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Equipment icon */}
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                              isSelected ? "bg-[#24C26B]/10" : "bg-[#143269]/8"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                isSelected ? "text-[#24C26B]" : "text-[#143269]"
                              }`}
                            />
                          </div>

                          {/* Name & specs */}
                          <h4 className="font-semibold text-sm text-[#143269] leading-tight mb-1 pr-6">
                            {item.name}
                          </h4>
                          {specs && (
                            <p className="text-[11px] text-gray-500 leading-snug mb-3 line-clamp-2">
                              {specs}
                            </p>
                          )}

                          {/* Price */}
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-lg font-bold text-[#24C26B]">
                              € {parseFloat(item.price).toLocaleString("de-DE")}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              /Tag
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickAction(key, item);
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium text-[#2B5597] hover:bg-[#2B5597]/10 px-2 py-1 rounded-md transition-colors"
                            >
                              <ClipboardList className="h-3 w-3" />
                              Aufgabe
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEquipment(key, item);
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEquipment(key, item.id);
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors ml-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wizard navigation — H&P style */}
      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-[#143269] hover:bg-[#143269]/5"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück: Anlagen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="text-[#143269] hover:bg-[#143269]/5"
        >
          Weiter: Zusammenfassung
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
