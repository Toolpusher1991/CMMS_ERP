import { Card } from "@/components/ui/card";
import {
  Building2,
  FileText,
  Package,
  BarChart3,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { useRigConfigurator } from "@/hooks/useRigConfigurator";
import {
  RequirementsTab,
  RigSelectionTab,
  EquipmentTab,
  SummaryTab,
  TenderTab,
  PriceEditDialog,
  EquipmentFormDialog,
  RigEditDialog,
  QuickActionDialog,
  EquipmentManagementDialog,
  ContractDateDialog,
} from "@/components/rig-configurator";

const tabDefs = [
  { id: "requirements", label: "Anforderungen", icon: FileText },
  { id: "rigs", label: "Anlagen", icon: Building2, countKey: "rigs" as const },
  { id: "equipment", label: "Equipment", icon: Package, needsRig: true },
  { id: "summary", label: "Zusammenfassung", icon: BarChart3, needsRig: true },
  {
    id: "tender",
    label: "Tender",
    icon: Calculator,
    countKey: "tender" as const,
  },
];

const RigConfigurator = () => {
  const state = useRigConfigurator();

  const counts = {
    rigs: state.matchedRigs.length,
    tender: state.savedConfigurations.length,
  };

  return (
    <div className="min-h-screen flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* ─── Navy Header ─── */}
      <div className="bg-[#143269] text-white">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">
                Rig Configurator
              </h1>
              <p className="text-[11px] text-white/60">
                Professionelle Anlagenkonfiguration für Commerce
              </p>
            </div>
          </div>
          <Card className="px-5 py-3 bg-white/10 border-white/20 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-xs text-white/60">Gesamtpreis (Tagesrate)</p>
              <p className="text-2xl font-bold text-white">
                € {state.calculateTotal().toLocaleString("de-DE")}
              </p>
            </div>
          </Card>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-[#2B5597] via-[#24C26B] to-[#24C26B]" />
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 bg-[#f7f9fc] dark:bg-slate-950">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          {/* ─── H&P-style Tab Navigation ─── */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-8">
            {tabDefs.map((tab) => {
              const Icon = tab.icon;
              const isActive = state.activeTab === tab.id;
              const isDisabled = tab.needsRig && !state.selectedRig;
              const count = tab.countKey ? counts[tab.countKey] : undefined;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && state.setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium whitespace-nowrap border transition-all
                    ${
                      isActive
                        ? "bg-[#2B5597] text-white border-[#2B5597] shadow-md"
                        : isDisabled
                          ? "bg-white dark:bg-slate-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-slate-700 cursor-not-allowed"
                          : "bg-white dark:bg-slate-800 text-muted-foreground border-gray-200 dark:border-slate-700 hover:border-[#2B5597]/50"
                    }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0
                      ${
                        isActive
                          ? "bg-white text-[#2B5597]"
                          : isDisabled
                            ? "bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-gray-600"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="uppercase tracking-wide text-xs">
                    {tab.label}
                    {count !== undefined && ` (${count})`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── Tab Content ─── */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              {state.activeTab === "requirements" && (
                <RequirementsTab
                  requirements={state.requirements}
                  setRequirements={state.setRequirements}
                  matchedRigsCount={state.matchedRigs.length}
                  onFindRigs={() => state.setActiveTab("rigs")}
                  onReset={state.resetRequirements}
                />
              )}
              {state.activeTab === "rigs" && (
                <RigSelectionTab
                  matchedRigs={state.matchedRigs}
                  selectedRig={state.selectedRig}
                  isAdmin={state.isAdmin}
                  savedConfigurations={state.savedConfigurations}
                  onSelectRig={state.setSelectedRig}
                  onEditRigPrice={state.openRigPriceEdit}
                  onEditRig={state.openRigEdit}
                  onBack={() => state.setActiveTab("requirements")}
                  onNext={() => state.setActiveTab("equipment")}
                />
              )}
              {state.activeTab === "equipment" && (
                <EquipmentTab
                  equipmentCategories={state.equipmentCategories}
                  selectedEquipment={state.selectedEquipment}
                  onToggleEquipment={state.toggleEquipment}
                  onAddEquipment={state.openAddEquipmentDialog}
                  onEditEquipment={state.openEditEquipmentDialog}
                  onDeleteEquipment={state.deleteEquipmentItem}
                  onQuickAction={state.openQuickActionDialog}
                  onBack={() => state.setActiveTab("rigs")}
                  onNext={() => state.setActiveTab("summary")}
                />
              )}
              {state.activeTab === "summary" && (
                <SummaryTab
                  requirements={state.requirements}
                  selectedRig={state.selectedRig}
                  selectedEquipment={state.selectedEquipment}
                  equipmentCategories={state.equipmentCategories}
                  calculateTotal={state.calculateTotal}
                  onExport={state.exportConfiguration}
                  onSaveAsTender={state.saveCurrentConfiguration}
                  canSaveTender={state.canSaveTender}
                  onBack={() => state.setActiveTab("equipment")}
                  onNext={() => state.setActiveTab("tender")}
                />
              )}
              {state.activeTab === "tender" && (
                <TenderTab
                  selectedRig={state.selectedRig}
                  requirements={state.requirements}
                  selectedEquipment={state.selectedEquipment}
                  calculateTotal={state.calculateTotal}
                  savedConfigurations={state.savedConfigurations}
                  loadingTenders={state.loadingTenders}
                  tenderViewMode={state.tenderViewMode}
                  setTenderViewMode={state.setTenderViewMode}
                  onSaveConfiguration={state.saveCurrentConfiguration}
                  onToggleContract={state.toggleContractStatus}
                  onDeleteTender={state.deleteTenderConfiguration}
                  onEquipmentManagement={state.openEquipmentManagement}
                  onGoToRequirements={() => state.setActiveTab("requirements")}
                  onBack={() => state.setActiveTab("summary")}
                  calculateTenderDuration={state.calculateTenderDuration}
                  calculateDaysElapsed={state.calculateDaysElapsed}
                />
              )}
            </div>
          </div>

          {/* ─── Bottom Navigation ─── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="text-sm text-muted-foreground">
              {state.selectedRig
                ? `Ausgewählt: ${state.selectedRig.name}`
                : "Keine Anlage ausgewählt"}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Weiter:</span>
              {state.activeTab === "requirements" && (
                <button
                  className="text-[#2B5597] font-medium hover:underline flex items-center gap-0.5"
                  onClick={() => state.setActiveTab("rigs")}
                >
                  Anlagen auswählen <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {state.activeTab === "rigs" && state.selectedRig && (
                <button
                  className="text-[#2B5597] font-medium hover:underline flex items-center gap-0.5"
                  onClick={() => state.setActiveTab("equipment")}
                >
                  Equipment <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {state.activeTab === "equipment" && (
                <button
                  className="text-[#2B5597] font-medium hover:underline flex items-center gap-0.5"
                  onClick={() => state.setActiveTab("summary")}
                >
                  Zusammenfassung <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {state.activeTab === "summary" && (
                <button
                  className="text-[#2B5597] font-medium hover:underline flex items-center gap-0.5"
                  onClick={() => state.setActiveTab("tender")}
                >
                  Tender <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <PriceEditDialog
        open={state.editPriceDialogOpen}
        onOpenChange={state.setEditPriceDialogOpen}
        editingRig={state.editingRig}
        editingEquipmentItem={state.editingEquipmentItem}
        tempPrice={state.tempPrice}
        setTempPrice={state.setTempPrice}
        onSave={state.savePrice}
      />

      <EquipmentFormDialog
        open={state.equipmentDialogOpen}
        onOpenChange={state.setEquipmentDialogOpen}
        mode={state.equipmentFormMode}
        selectedCategory={state.selectedCategory}
        equipmentCategories={state.equipmentCategories}
        form={state.equipmentForm}
        setForm={state.setEquipmentForm}
        onSave={state.saveEquipmentItem}
      />

      <RigEditDialog
        open={state.rigEditDialogOpen}
        onOpenChange={state.setRigEditDialogOpen}
        editingRigData={state.editingRigData}
        setEditingRigData={state.setEditingRigData}
        saving={state.savingRig}
        onSave={state.saveRigChanges}
      />

      <QuickActionDialog
        open={state.quickActionDialogOpen}
        onOpenChange={state.setQuickActionDialogOpen}
        equipment={state.quickActionEquipment}
        form={state.quickActionForm}
        setForm={state.setQuickActionForm}
        users={state.users}
        onSubmit={state.createQuickAction}
      />

      <EquipmentManagementDialog
        open={state.equipmentManagementDialogOpen}
        onOpenChange={state.setEquipmentManagementDialogOpen}
        editingConfig={state.editingTenderConfig}
        equipmentCategories={state.equipmentCategories}
        tempSelection={state.tempEquipmentSelection}
        setTempSelection={state.setTempEquipmentSelection}
        onSave={state.saveEquipmentChanges}
      />

      <ContractDateDialog
        open={state.contractDateDialogOpen}
        onOpenChange={state.setContractDateDialogOpen}
        pendingConfig={state.pendingContractConfig}
        contractStartDate={state.contractStartDate}
        setContractStartDate={state.setContractStartDate}
        isSubmitting={state.isSubmittingContract}
        onConfirm={state.confirmContractStartDate}
      />
    </div>
  );
};

export default RigConfigurator;
