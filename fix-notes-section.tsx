// BEREINIGTE VERSION der Notizen-Liste (Lines ca. 1777-1950)
// Diese Version ersetzt die fehlerhafte Version mit den \n Escape-Sequenzen

{
  /* Liste der Informationen */
}
{
  selectedRig.generalInfo && selectedRig.generalInfo.length > 0 ? (
    <div className="space-y-4">
      {/* Group notes by urgency */}
      {(() => {
        const overdueNotes = selectedRig.generalInfo.filter((info) => {
          if (!info.deadline) return false;
          const daysUntil = Math.ceil(
            (new Date(info.deadline).getTime() -
              new Date("2026-02-15").getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return daysUntil < 0;
        });
        const urgentNotes = selectedRig.generalInfo.filter((info) => {
          if (!info.deadline) return false;
          const daysUntil = Math.ceil(
            (new Date(info.deadline).getTime() -
              new Date("2026-02-15").getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return daysUntil >= 0 && daysUntil <= 7;
        });
        const upcomingNotes = selectedRig.generalInfo.filter((info) => {
          if (!info.deadline) return false;
          const daysUntil = Math.ceil(
            (new Date(info.deadline).getTime() -
              new Date("2026-02-15").getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return daysUntil > 7;
        });
        const noDeadlineNotes = selectedRig.generalInfo.filter(
          (info) => !info.deadline,
        );

        return (
          <>
            {/* Overdue Notes */}
            {overdueNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <h4 className="text-sm font-semibold text-red-400">
                    Überfällig ({overdueNotes.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {overdueNotes.map((info) => {
                    const daysUntil = Math.ceil(
                      (new Date(info.deadline!).getTime() -
                        new Date("2026-02-15").getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const isEditing = editingInfoId === info.id;

                    return (
                      <Card
                        key={info.id}
                        className="bg-red-500/10 border border-red-500/50"
                      >
                        <CardContent className="pt-4 pb-3">
                          {isEditing ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editedInfo.description || ""}
                                onChange={(e) =>
                                  setEditedInfo({
                                    ...editedInfo,
                                    description: e.target.value,
                                  })
                                }
                                className="!bg-slate-900 !border-slate-700 !text-white resize-none"
                                style={{
                                  backgroundColor: "#0f172a",
                                  borderColor: "#334155",
                                  color: "#ffffff",
                                }}
                                rows={2}
                              />
                              <Input
                                type="date"
                                value={editedInfo.deadline || ""}
                                onChange={(e) =>
                                  setEditedInfo({
                                    ...editedInfo,
                                    deadline: e.target.value,
                                  })
                                }
                                className="!bg-slate-900 !border-slate-700 !text-white"
                                style={{
                                  backgroundColor: "#0f172a",
                                  borderColor: "#334155",
                                  color: "#ffffff",
                                  colorScheme: "dark",
                                }}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingInfoId(null);
                                    setEditedInfo({});
                                  }}
                                  className="border-slate-700"
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditedInfo}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Speichern
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <p className="text-white text-sm leading-relaxed">
                                  {info.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    Erstellt:{" "}
                                    {new Date(
                                      info.createdDate,
                                    ).toLocaleDateString("de-DE")}
                                  </span>
                                  <span className="flex items-center gap-1 font-semibold text-red-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(
                                      info.deadline!,
                                    ).toLocaleDateString("de-DE")}{" "}
                                    ({Math.abs(daysUntil)} Tage überfällig!)
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditGeneralInfo(info)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 w-9 p-0"
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteGeneralInfo(info.id)
                                  }
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 w-9 p-0"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Urgent Notes (7 days) */}
            {urgentNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-sm font-semibold text-yellow-400">
                    Dringend - nächste 7 Tage ({urgentNotes.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {urgentNotes
                    .sort(
                      (a, b) =>
                        new Date(a.deadline!).getTime() -
                        new Date(b.deadline!).getTime(),
                    )
                    .map((info) => {
                      const daysUntil = Math.ceil(
                        (new Date(info.deadline!).getTime() -
                          new Date("2026-02-15").getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const isEditing = editingInfoId === info.id;

                      return (
                        <Card
                          key={info.id}
                          className="bg-yellow-500/10 border border-yellow-500/50"
                        >
                          <CardContent className="pt-4 pb-3">
                            {isEditing ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editedInfo.description || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      description: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white resize-none"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                  }}
                                  rows={2}
                                />
                                <Input
                                  type="date"
                                  value={editedInfo.deadline || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      deadline: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                    colorScheme: "dark",
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingInfoId(null);
                                      setEditedInfo({});
                                    }}
                                    className="border-slate-700"
                                  >
                                    Abbrechen
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEditedInfo}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Speichern
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <p className="text-white text-sm leading-relaxed">
                                    {info.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="h-3.5 w-3.5" />
                                      Erstellt:{" "}
                                      {new Date(
                                        info.createdDate,
                                      ).toLocaleDateString("de-DE")}
                                    </span>
                                    <span className="flex items-center gap-1 font-semibold text-yellow-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {new Date(
                                        info.deadline!,
                                      ).toLocaleDateString("de-DE")}{" "}
                                      (noch {daysUntil} Tage)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditGeneralInfo(info)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 w-9 p-0"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteGeneralInfo(info.id)
                                    }
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 w-9 p-0"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Upcoming Notes */}
            {upcomingNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-blue-400">
                    Zukünftig ({upcomingNotes.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {upcomingNotes
                    .sort(
                      (a, b) =>
                        new Date(a.deadline!).getTime() -
                        new Date(b.deadline!).getTime(),
                    )
                    .map((info) => {
                      const daysUntil = Math.ceil(
                        (new Date(info.deadline!).getTime() -
                          new Date("2026-02-15").getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const isEditing = editingInfoId === info.id;
                      return (
                        <Card
                          key={info.id}
                          className="bg-slate-800/50 border border-slate-700"
                        >
                          <CardContent className="pt-4 pb-3">
                            {isEditing ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editedInfo.description || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      description: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white resize-none"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                  }}
                                  rows={2}
                                />
                                <Input
                                  type="date"
                                  value={editedInfo.deadline || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      deadline: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                    colorScheme: "dark",
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingInfoId(null);
                                      setEditedInfo({});
                                    }}
                                    className="border-slate-700"
                                  >
                                    Abbrechen
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEditedInfo}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Speichern
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <p className="text-white text-sm leading-relaxed">
                                    {info.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="h-3.5 w-3.5" />
                                      Erstellt:{" "}
                                      {new Date(
                                        info.createdDate,
                                      ).toLocaleDateString("de-DE")}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium text-blue-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {new Date(
                                        info.deadline!,
                                      ).toLocaleDateString("de-DE")}{" "}
                                      (noch {daysUntil} Tage)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditGeneralInfo(info)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 w-9 p-0"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteGeneralInfo(info.id)
                                    }
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 w-9 p-0"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* No Deadline Notes */}
            {noDeadlineNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-400">
                    Allgemeine Notizen ({noDeadlineNotes.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {noDeadlineNotes
                    .sort(
                      (a, b) =>
                        new Date(b.createdDate).getTime() -
                        new Date(a.createdDate).getTime(),
                    )
                    .map((info) => {
                      const isEditing = editingInfoId === info.id;
                      return (
                        <Card
                          key={info.id}
                          className="bg-slate-800/50 border border-slate-700"
                        >
                          <CardContent className="pt-4 pb-3">
                            {isEditing ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editedInfo.description || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      description: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white resize-none"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                  }}
                                  rows={2}
                                />
                                <Input
                                  type="date"
                                  value={editedInfo.deadline || ""}
                                  onChange={(e) =>
                                    setEditedInfo({
                                      ...editedInfo,
                                      deadline: e.target.value,
                                    })
                                  }
                                  className="!bg-slate-900 !border-slate-700 !text-white"
                                  style={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#ffffff",
                                    colorScheme: "dark",
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingInfoId(null);
                                      setEditedInfo({});
                                    }}
                                    className="border-slate-700"
                                  >
                                    Abbrechen
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEditedInfo}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Speichern
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <p className="text-white text-sm leading-relaxed">
                                    {info.description}
                                  </p>
                                  <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    Erstellt:{" "}
                                    {new Date(
                                      info.createdDate,
                                    ).toLocaleDateString("de-DE")}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditGeneralInfo(info)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 w-9 p-0"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteGeneralInfo(info.id)
                                    }
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 w-9 p-0"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  ) : (
    <p className="text-center text-slate-400 text-sm py-8">
      Keine Informationen vorhanden
    </p>
  );
}
