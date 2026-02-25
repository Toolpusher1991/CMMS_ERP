import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Edit2, Trash2, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface CommentSectionProps {
  comments: Comment[];
  currentUserId: string;
  onAddComment: (text: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  isLoading = false,
}) => {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
      toast({
        title: "Kommentar hinzugefügt",
        description: "Dein Kommentar wurde erfolgreich hinzugefügt.",
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update comment
  const handleUpdateComment = async () => {
    if (!editingId || !editText.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateComment(editingId, editText.trim());
      setEditingId(null);
      setEditText("");
      toast({
        title: "Kommentar aktualisiert",
        description: "Dein Kommentar wurde erfolgreich aktualisiert.",
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    try {
      await onDeleteComment(deleteId);
      setDeleteId(null);
      toast({
        title: "Kommentar gelöscht",
        description: "Der Kommentar wurde erfolgreich gelöscht.",
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Kommentare
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Noch keine Kommentare</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isOwner = comment.user.id === currentUserId;
                const isEditing = editingId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg border ${
                      isOwner ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {getInitials(
                            comment.user.firstName,
                            comment.user.lastName
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-medium text-sm">
                              {comment.user.firstName} {comment.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                              {comment.updatedAt !== comment.createdAt && (
                                <span className="ml-1">(bearbeitet)</span>
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          {isOwner && !isEditing && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.text);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => setDeleteId(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Comment Text */}
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[60px]"
                              disabled={isSubmitting}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleUpdateComment}
                                disabled={isSubmitting || !editText.trim()}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Speichern
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditText("");
                                }}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">
                            {comment.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* New Comment Input */}
        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Schreibe einen Kommentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={isLoading || isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleAddComment();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Drücke Strg+Enter zum Senden
            </p>
            <Button
              onClick={handleAddComment}
              disabled={isLoading || isSubmitting || !newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Kommentar senden
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kommentar löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du diesen Kommentar wirklich löschen? Diese Aktion kann
                nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteComment}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
