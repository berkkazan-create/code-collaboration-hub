import { useState } from 'react';
import { useCategories, Category, CategoryInput } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Edit, Trash2, ChevronRight, FolderOpen, Folder, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

interface CategoryManagerProps {
  onSelectCategory?: (category: Category) => void;
  selectedCategoryId?: string;
}

export const CategoryManager = ({ onSelectCategory, selectedCategoryId }: CategoryManagerProps) => {
  const { hierarchicalCategories, mainCategories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<CategoryInput>({
    name: '',
    description: '',
    color: '#10b981',
    parent_id: null,
    requires_serial: false,
  });

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
    } else {
      await createCategory.mutateAsync(formData);
    }
    handleCloseDialog();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      parent_id: category.parent_id,
      requires_serial: category.requires_serial || false,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#10b981',
      parent_id: null,
      requires_serial: false,
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCategory.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleAddSubcategory = (parentId: string) => {
    setFormData({
      name: '',
      description: '',
      color: '#10b981',
      parent_id: parentId,
      requires_serial: false,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Kategoriler
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => {
              setFormData({ name: '', description: '', color: '#10b981', parent_id: null, requires_serial: false });
              setEditingCategory(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ana Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategori Düzenle' : formData.parent_id ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingCategory && !formData.parent_id && (
                <div>
                  <Label>Üst Kategori (Opsiyonel)</Label>
                  <Select
                    value={formData.parent_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ana kategori olarak ekle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ana kategori olarak ekle</SelectItem>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Kategori Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Renk</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <div>
                    <Label className="font-medium">IMEI/Seri No Zorunlu</Label>
                    <p className="text-xs text-muted-foreground">Stok girişinde IMEI zorunlu olsun</p>
                  </div>
                </div>
                <Switch
                  checked={formData.requires_serial}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_serial: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {hierarchicalCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Henüz kategori eklenmemiş
        </p>
      ) : (
        <div className="space-y-2">
          {hierarchicalCategories.map((mainCategory) => (
            <Collapsible
              key={mainCategory.id}
              open={openCategories.includes(mainCategory.id)}
              onOpenChange={() => toggleCategory(mainCategory.id)}
            >
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className={`flex items-center justify-between p-3 ${
                    selectedCategoryId === mainCategory.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 flex-1 text-left">
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform ${
                          openCategories.includes(mainCategory.id) ? 'rotate-90' : ''
                        }`}
                      />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: mainCategory.color }}
                      />
                      <span className="font-medium">{mainCategory.name}</span>
                      {mainCategory.children && mainCategory.children.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({mainCategory.children.length})
                        </span>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleAddSubcategory(mainCategory.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(mainCategory)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(mainCategory.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  {mainCategory.children && mainCategory.children.length > 0 && (
                    <div className="border-t border-border">
                      {mainCategory.children.map((subCategory) => (
                        <div
                          key={subCategory.id}
                          className={`flex items-center justify-between p-3 pl-10 hover:bg-muted/50 cursor-pointer ${
                            selectedCategoryId === subCategory.id ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => onSelectCategory?.(subCategory)}
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-muted-foreground" />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subCategory.color }}
                            />
                            <span className="text-sm">{subCategory.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(subCategory);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(subCategory.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kategoriyi silmek istediğinizden emin misiniz? Alt kategoriler de silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
