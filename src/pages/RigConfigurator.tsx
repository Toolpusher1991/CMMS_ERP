import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  FileText,
  Package,
  BarChart3,
  Calculator,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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

const RigConfigurator = () => {
  const state = useRigConfigurator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <PageHeader
              title="Rig Configurator"
              subtitle="Professionelle Anlagenkonfiguration für Commerce"
              icon={<Building2 className="h-5 w-5" />}
              className="mb-0"
            />
            <Card className="px-4 sm:px-6 py-3 sm:py-4 w-full lg:w-auto">
              <div className="text-center lg:text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gesamtpreis (Tagesrate)
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  € {state.calculateTotal().toLocaleString("de-DE")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs
          value={state.activeTab}
          onValueChange={state.setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger
              value="requirements"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Anforderungen</span>
            </TabsTrigger>
            <TabsTrigger
              value="rigs"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">
                Anlagen ({state.matchedRigs.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!state.selectedRig}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Equipment</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!state.selectedRig}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Zusammenfassung</span>
            </TabsTrigger>
            <TabsTrigger
              value="tender"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground col-span-2 sm:col-span-1"
            >
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">
                Tender ({state.savedConfigurations.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Requirements */}
          <TabsContent value="requirements" className="space-y-6">
            <RequirementsTab
              requirements={state.requirements}
              setRequirements={state.setRequirements}
              matchedRigsCount={state.matchedRigs.length}
              onFindRigs={() => state.setActiveTab("rigs")}
              onReset={state.resetRequirements}
            />
          </TabsContent>

          {/* Tab 2: Rig Selection */}
          <TabsContent value="rigs" className="space-y-4">
            <RigSelectionTab
              matchedRigs={state.matchedRigs}
              selectedRig={state.selectedRig}
              isAdmin={state.isAdmin}
              onSelectRig={state.setSelectedRig}
              onEditRigPrice={state.openRigPriceEdit}
              onEditRig={state.openRigEdit}
              onBack={() => state.setActiveTab("requirements")}
              onNext={() => state.setActiveTab("equipment")}
            />
          </TabsContent>

          {/* Tab 3: Equipment */}
          <TabsContent value="equipment" className="space-y-4">
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
          </TabsContent>

          {/* Tab 4: Summary */}
          <TabsContent value="summary" className="space-y-4">
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
          </TabsContent>

          {/* Tab 5: Tender Management */}
          <TabsContent value="tender" className="space-y-6">
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
          </TabsContent>
        </Tabs>
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
