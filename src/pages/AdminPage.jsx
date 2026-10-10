import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  seedInitialBranches,
  uploadImageFile,
  seedInitialMenuIfEmpty,
  designateAdmin,
} from "../firebase/services";
import { checkDuplicateBranch } from "../utils/geocoding";
import BranchMapAdmin from "../components/map/BranchMapAdmin";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  MapPin,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Upload,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Compass,
  AlertTriangle,
  Crosshair,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const { currentUser, isAdmin, loading: authLoading, logout, claimAdminRole } = useAuth();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'branches' | 'products' | 'categories' | 'orders' | 'settings'

  // Data states
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchCityFilter, setBranchCityFilter] = useState("all");
  const [branchStatusFilter, setBranchStatusFilter] = useState("all");

  // Selected items on map
  const [selectedBranchOnMap, setSelectedBranchOnMap] = useState(null);

  // Modals
  const [productModal, setProductModal] = useState({ open: false, mode: "create", item: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, mode: "create", item: null });
  const [branchModal, setBranchModal] = useState({ open: false, mode: "create", item: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: "", id: "", title: "" });

  // Async loading & duplicate submission prevention states (Requirement 2)
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingBranch, setSubmittingBranch] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [seedingBranches, setSeedingBranches] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "burgers",
    price: "",
    description: "",
    imageUrl: "",
    calories: "",
    isAvailable: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    displayOrder: 1,
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "",
    latitude: 39.7747,
    longitude: 64.4286,
    phone: "+998 65 224 11 01",
    openingHours: "10:00 — 02:00",
    isActive: true,
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [newAdminUid, setNewAdminUid] = useState("");

  // Toast notifier
  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Admin Data
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [cats, prods, ords, brs] = await Promise.all([
        getCategories().catch(() => []),
        getProducts().catch(() => []),
        getOrders().catch(() => []),
        getBranches(true).catch(() => []), // load all including inactive
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setOrders(ords || []);
      setBranches(brs || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      notify("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser) {
      loadData();
    }
  }, [authLoading, currentUser]);

  // Derived Statistics
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeProds = products.filter((p) => p.isAvailable).length;
    const newOrders = orders.filter((o) => o.status === "new" || o.status === "pending").length;
    const activeBrs = branches.filter((b) => b.isActive).length;
    const citiesCount = new Set(branches.map((b) => b.city).filter(Boolean)).size;

    return {
      revenue: totalRev,
      productsCount: products.length,
      activeProducts: activeProds,
      categoriesCount: categories.length,
      ordersCount: orders.length,
      newOrdersCount: newOrders,
      branchesCount: branches.length,
      activeBranchesCount: activeBrs,
      citiesCount,
    };
  }, [products, categories, orders, branches]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCatFilter === "all" || p.categoryId === productCatFilter;
      const matchSearch =
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, productCatFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const matchSearch =
        !orderSearch ||
        o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone?.toLowerCase().includes(orderSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchCity = branchCityFilter === "all" || b.city?.toLowerCase() === branchCityFilter.toLowerCase();
      const matchStatus =
        branchStatusFilter === "all" ||
        (branchStatusFilter === "active" && b.isActive) ||
        (branchStatusFilter === "inactive" && !b.isActive);
      const matchSearch =
        !branchSearch ||
        b.name?.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.address?.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.city?.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.phone?.includes(branchSearch);
      return matchCity && matchStatus && matchSearch;
    });
  }, [branches, branchCityFilter, branchStatusFilter, branchSearch]);

  const uniqueBranchCities = useMemo(() => {
    return Array.from(new Set(branches.map((b) => b.city).filter(Boolean)));
  }, [branches]);

  // Auth Guards
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0e0b08] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#e63946] animate-spin" />
          <p className="text-sm font-semibold text-white/60">Admin panel yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0e0b08] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#e63946]/10 text-[#e63946] rounded-3xl flex items-center justify-center mb-4 border border-[#e63946]/20 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">Admin Paneli Himoyalangan</h2>
        <p className="text-white/60 text-sm max-w-md mb-6">
          Admin boshqaruv tizimiga kirish uchun avtorizatsiyadan o'tishingiz lozim.
        </p>
        <Link
          to="/login"
          state={{ from: "/admin" }}
          className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl shadow-[#e63946]/25 transition flex items-center gap-2"
        >
          Telefon orqali kirish <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0e0b08] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mb-4 border border-amber-500/20 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">Ruxsat Cheklangan</h2>
        <p className="text-white/60 text-sm max-w-md mb-6">
          Sizning hisobingiz <strong>({currentUser.phoneNumber || currentUser.email})</strong> ga hozircha admin huquqlari biriktirilmagan.
        </p>

        <div className="bg-[#14100c] border border-white/10 rounded-2xl p-5 max-w-sm w-full mb-6 text-left">
          <p className="text-xs text-white/80 font-bold mb-3">Tizim egasi yoki Sinov rejimi:</p>
          <p className="text-[11px] text-white/60 mb-4 leading-relaxed">
            Agar siz loyiha egasi bo'lsangiz, bir martalik admin huquqini faollashtirishingiz mumkin:
          </p>
          <button
            onClick={async () => {
              const res = await claimAdminRole();
              if (res) {
                notify("Admin huquqlari muvaffaqiyatli berildi!");
                loadData();
              } else {
                notify("Xatolik yuz berdi", "error");
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs transition"
          >
            Admin Huquqini Faollashtirish (Bootstrap)
          </button>
        </div>

        <div className="flex gap-4">
          <Link to="/" className="text-xs text-white/60 hover:text-white underline">
            Do'konga qaytish
          </Link>
          <button onClick={logout} className="text-xs text-[#e63946] hover:underline">
            Boshqa hisob bilan kirish
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIONS & SUBMISSIONS WITH STRICT LOADING AND DUPLICATE PREVENTION ---

  // Image Upload
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadImageFile(file, type);
      if (type === "products") {
        setProductForm((prev) => ({ ...prev, imageUrl: url }));
      } else {
        setCategoryForm((prev) => ({ ...prev, imageUrl: url }));
      }
      notify("Rasm muvaffaqiyatli yuklandi");
    } catch (err) {
      console.error(err);
      notify(err.message || "Rasm yuklashda xatolik", "error");
    } finally {
      setImageUploading(false);
    }
  };

  // 1. Food / Product Save (Requirement 2)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (submittingProduct) return; // Prevent duplicate submission

    if (!productForm.name?.trim() || !productForm.price) {
      notify("Nom va narxni kiritish majburiy", "error");
      return;
    }

    setSubmittingProduct(true); // Disable button immediately
    try {
      const payload = {
        name: productForm.name.trim(),
        categoryId: productForm.categoryId,
        price: Number(productForm.price),
        description: productForm.description?.trim() || "",
        imageUrl: productForm.imageUrl || "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80",
        calories: Number(productForm.calories) || 0,
        isAvailable: Boolean(productForm.isAvailable),
      };

      if (productModal.mode === "create") {
        await createProduct(payload);
        notify("Yangi taom muvaffaqiyatli qo'shildi!");
      } else {
        await updateProduct(productModal.item.id, payload);
        notify("Taom muvaffaqiyatli yangilandi!");
      }

      // Reset form and close modal on success
      setProductModal({ open: false, mode: "create", item: null });
      setProductForm({
        name: "",
        categoryId: "burgers",
        price: "",
        description: "",
        imageUrl: "",
        calories: "",
        isAvailable: true,
      });
      await loadData();
    } catch (err) {
      console.error("Food saving error:", err);
      notify(err.message || "Taomni saqlashda xatolik yuz berdi", "error");
      // Keep user on the form and re-enable button on error
    } finally {
      setSubmittingProduct(false);
    }
  };

  // 2. Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (submittingCategory) return;

    if (!categoryForm.name?.trim()) {
      notify("Kategoriya nomi majburiy", "error");
      return;
    }

    setSubmittingCategory(true);
    try {
      const slug =
        categoryForm.slug?.trim() ||
        categoryForm.name.toLowerCase().replace(/\s+/g, "-");
      const payload = {
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description?.trim() || "",
        imageUrl: categoryForm.imageUrl || "",
        displayOrder: Number(categoryForm.displayOrder) || 1,
      };

      if (categoryModal.mode === "create") {
        await createCategory(payload);
        notify("Kategoriya qo'shildi!");
      } else {
        await updateCategory(categoryModal.item.id, payload);
        notify("Kategoriya yangilandi!");
      }

      setCategoryModal({ open: false, mode: "create", item: null });
      setCategoryForm({ name: "", slug: "", description: "", imageUrl: "", displayOrder: 1 });
      await loadData();
    } catch (err) {
      console.error(err);
      notify(err.message || "Kategoriyani saqlashda xatolik", "error");
    } finally {
      setSubmittingCategory(false);
    }
  };

  // 3. Branch Save (Requirement 1 & 2: Global Branch Management with Duplicate Prevention)
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (submittingBranch) return; // Prevent duplicate submissions

    if (!branchForm.name?.trim()) {
      notify("Filial nomini kiritish majburiy", "error");
      return;
    }

    if (!branchForm.city?.trim() || !branchForm.address?.trim()) {
      notify("Shahar va to'liq manzilni kiriting", "error");
      return;
    }

    const lat = parseFloat(branchForm.latitude);
    const lng = parseFloat(branchForm.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      notify("Koordinatalar noto'g'ri kiritilgan", "error");
      return;
    }

    // Check duplicate branch unless user already acknowledged warning
    if (!duplicateWarning) {
      const dupCheck = checkDuplicateBranch(
        { ...branchForm, latitude: lat, longitude: lng },
        branches,
        branchModal.mode === "edit" ? branchModal.item?.id : null
      );

      if (dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck.reason);
        return; // Pause and display duplicate warning to admin
      }
    }

    setSubmittingBranch(true); // Disable button immediately
    try {
      const payload = {
        name: branchForm.name.trim(),
        country: branchForm.country?.trim() || "O'zbekiston",
        city: branchForm.city.trim(),
        address: branchForm.address.trim(),
        latitude: lat,
        longitude: lng,
        phone: branchForm.phone?.trim() || "+998 71 234 56 67",
        openingHours: branchForm.openingHours?.trim() || "10:00 — 02:00",
        isActive: Boolean(branchForm.isActive),
      };

      if (branchModal.mode === "create") {
        await createBranch(payload);
        notify("Yangi filial muvaffaqiyatli saqlandi!");
      } else {
        await updateBranch(branchModal.item.id, payload);
        notify("Filial muvaffaqiyatli yangilandi!");
      }

      // Reset form, clear warning, close modal
      setDuplicateWarning(null);
      setBranchModal({ open: false, mode: "create", item: null });
      setBranchForm({
        name: "",
        country: "O'zbekiston",
        city: "Buxoro",
        address: "",
        latitude: 39.7747,
        longitude: 64.4286,
        phone: "+998 65 224 11 01",
        openingHours: "10:00 — 02:00",
        isActive: true,
      });
      await loadData();
    } catch (err) {
      console.error("Branch saving error:", err);
      notify(err.message || "Filialni saqlashda xatolik yuz berdi", "error");
    } finally {
      setSubmittingBranch(false);
    }
  };

  // Toggle Branch Active/Inactive
  const handleToggleBranchStatus = async (branch) => {
    if (actionLoadingId === branch.id) return;
    setActionLoadingId(branch.id);
    try {
      const nextActive = !branch.isActive;
      await updateBranch(branch.id, { isActive: nextActive });
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, isActive: nextActive } : b))
      );
      notify(
        nextActive
          ? `"${branch.name}" filiali faollashtirildi`
          : `"${branch.name}" filiali nofaol qilindi`
      );
    } catch (err) {
      console.error(err);
      notify("Statusni o'zgartirishda xatolik", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Product Availability
  const handleToggleAvailable = async (prod) => {
    if (actionLoadingId === prod.id) return;
    setActionLoadingId(prod.id);
    try {
      await updateProduct(prod.id, { isAvailable: !prod.isAvailable });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
      notify(prod.isAvailable ? "Mahsulot 'Tugagan' qilindi" : "Mahsulot 'Mavjud' qilindi");
    } catch (err) {
      console.error(err);
      notify("Statusni o'zgartirishda xatolik", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Order Status Change
  const handleOrderStatusChange = async (orderId, newStatus) => {
    if (actionLoadingId === orderId) return;
    setActionLoadingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      notify(`Buyurtma holati yangilandi: ${newStatus}`);
    } catch (err) {
      console.error(err);
      notify("Buyurtma holatini yangilashda xatolik", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Execute Deletion with Loading State
  const handleExecuteDelete = async () => {
    if (deletingItem) return;
    setDeletingItem(true);

    try {
      if (deleteConfirm.type === "product") {
        await deleteProduct(deleteConfirm.id);
        notify("Mahsulot o'chirildi");
      } else if (deleteConfirm.type === "category") {
        await deleteCategory(deleteConfirm.id);
        notify("Kategoriya o'chirildi");
      } else if (deleteConfirm.type === "branch") {
        await deleteBranch(deleteConfirm.id);
        notify("Filial o'chirildi");
      }
      setDeleteConfirm({ open: false, type: "", id: "", title: "" });
      await loadData();
    } catch (err) {
      console.error(err);
      notify("O'chirishda xatolik", "error");
    } finally {
      setDeletingItem(false);
    }
  };

  // Seed Menu
  const handleSeedMenu = async () => {
    try {
      const ok = await seedInitialMenuIfEmpty();
      if (ok) {
        notify("Boshlang'ich menyu bazaga yuklandi!");
        loadData();
      } else {
        notify("Baza allaqachon to'ldirilgan", "info");
      }
    } catch (err) {
      console.error(err);
      notify("Yuklashda xatolik", "error");
    }
  };

  // Seed Bukhara Branches
  const handleSeedBranches = async () => {
    setSeedingBranches(true);
    try {
      await seedInitialBranches();
      notify("5 ta Buxoro filiali va Toshkent markazi muvaffaqiyatli yuklandi!");
      await loadData();
    } catch (err) {
      console.error(err);
      notify("Filiallarni yuklashda xatolik", "error");
    } finally {
      setSeedingBranches(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminUid.trim()) return;
    try {
      await designateAdmin(newAdminUid.trim());
      notify("Yangi admin muvaffaqiyatli biriktirildi!");
      setNewAdminUid("");
    } catch (err) {
      console.error(err);
      notify("Admin qo'shishda xatolik", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0b08] text-[#f5f1ea] flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 transition animate-bounce ${
            notification.type === "error"
              ? "bg-red-500/20 border-red-500/40 text-red-300"
              : notification.type === "info"
              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {notification.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#14100c] border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <Link to="/" className="flex items-center gap-2.5 font-black text-lg">
              <span className="w-8 h-8 bg-[#e63946] rounded-xl flex items-center justify-center">
                <span className="w-3.5 h-3.5 bg-[#0e0b08] rounded-full"></span>
              </span>
              FoodHub Admin
            </Link>
            <span className="bg-[#e63946]/20 text-[#e63946] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              PROD
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {[
              { id: "overview", label: "Umumiy Ko'rsatkich", icon: LayoutDashboard },
              { id: "branches", label: "Filiallar & Xarita", icon: MapPin, badge: branches.length },
              { id: "products", label: "Taomlar Menyusi", icon: UtensilsCrossed, badge: products.length },
              { id: "categories", label: "Kategoriyalar", icon: Layers, badge: categories.length },
              { id: "orders", label: "Buyurtmalar", icon: ShoppingBag, badge: stats.newOrdersCount || null },
              { id: "settings", label: "Sozlamalar & Seed", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive ? "bg-black/30 text-white" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-6 border-t border-white/10 mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {currentUser.displayName || currentUser.phoneNumber || currentUser.email}
              </p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase">Superadmin</p>
            </div>
            <button
              onClick={logout}
              title="Chiqish"
              className="p-2 hover:bg-red-500/10 text-white/60 hover:text-red-400 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <Link
            to="/"
            className="w-full text-center block text-[11px] text-white/50 hover:text-white py-1.5 rounded-lg bg-white/5 transition"
          >
            ← Saytga o'tish
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <header className="px-6 md:px-8 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#0e0b08]/80 backdrop-blur sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-black text-white">
              {activeTab === "overview" && "Boshqaruv Paneli"}
              {activeTab === "branches" && "Global Filiallar Boshqaruvi"}
              {activeTab === "products" && "Taomlar Menyusi"}
              {activeTab === "categories" && "Taom Kategoriyalari"}
              {activeTab === "orders" && "Kelib Tushgan Buyurtmalar"}
              {activeTab === "settings" && "Tizim Sozlamalari"}
            </h1>
            <p className="text-xs text-white/50 mt-0.5">
              {activeTab === "branches"
                ? "Buxoro, Toshkent va dunyo bo'ylab FoodHub filiallarini xaritada boshqarish"
                : "Real vaqt rejimida yangilanuvchi ma'lumotlar"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#e63946]" : ""}`} />
              <span>{refreshing ? "Yangilanmoqda..." : "Yangilash"}</span>
            </button>

            {activeTab === "branches" && (
              <button
                onClick={() => {
                  setBranchForm({
                    name: "",
                    country: "O'zbekiston",
                    city: "Buxoro",
                    address: "Buxoro markazi",
                    latitude: 39.7747,
                    longitude: 64.4286,
                    phone: "+998 65 224 11 01",
                    openingHours: "10:00 — 02:00",
                    isActive: true,
                  });
                  setDuplicateWarning(null);
                  setBranchModal({ open: true, mode: "create", item: null });
                }}
                className="bg-[#e63946] hover:bg-[#ff4d5c] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#e63946]/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Filial Qo'shish</span>
              </button>
            )}

            {activeTab === "products" && (
              <button
                onClick={() => {
                  setProductForm({
                    name: "",
                    categoryId: categories[0]?.slug || "burgers",
                    price: "",
                    description: "",
                    imageUrl: "",
                    calories: "",
                    isAvailable: true,
                  });
                  setProductModal({ open: true, mode: "create", item: null });
                }}
                className="bg-[#e63946] hover:bg-[#ff4d5c] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#e63946]/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Taom Qo'shish</span>
              </button>
            )}

            {activeTab === "categories" && (
              <button
                onClick={() => {
                  setCategoryForm({ name: "", slug: "", description: "", imageUrl: "", displayOrder: categories.length + 1 });
                  setCategoryModal({ open: true, mode: "create", item: null });
                }}
                className="bg-[#e63946] hover:bg-[#ff4d5c] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#e63946]/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Kategoriya Qo'shish</span>
              </button>
            )}
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="p-6 md:p-8 space-y-8">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#14100c] border border-white/10 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-3">
                  <span className="text-xs font-bold">Jami Filiallar</span>
                  <MapPin className="w-4 h-4 text-[#e63946]" />
                </div>
                <div className="text-2xl font-black text-white">{stats.branchesCount} ta</div>
                <p className="text-[11px] text-emerald-400 mt-1">
                  {stats.activeBranchesCount} ta faol ({stats.citiesCount} shahar)
                </p>
              </div>

              <div className="bg-[#14100c] border border-white/10 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-3">
                  <span className="text-xs font-bold">Jami Buyurtmalar</span>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.ordersCount} ta</div>
                <p className="text-[11px] text-amber-400 mt-1">{stats.newOrdersCount} ta yangi buyurtma</p>
              </div>

              <div className="bg-[#14100c] border border-white/10 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-3">
                  <span className="text-xs font-bold">Menyu Mahsulotlari</span>
                  <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.productsCount} ta</div>
                <p className="text-[11px] text-white/50 mt-1">{stats.categoriesCount} ta toifada</p>
              </div>

              <div className="bg-[#14100c] border border-white/10 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-3">
                  <span className="text-xs font-bold">Tushum (Aylanma)</span>
                  <span className="text-xs font-bold text-emerald-400">UZS</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.revenue.toLocaleString()}
                </div>
                <p className="text-[11px] text-white/50 mt-1">Yetkazish to'lovlari bilan</p>
              </div>
            </div>

            {/* Global Branches Quick Preview */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#e63946]" /> Filiallar Xaritasi Preview
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Buxoro ({branches.filter((b) => b.city === "Buxoro").length} filial), Toshkent va boshqa shaharlar
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("branches")}
                  className="text-xs font-bold text-[#e63946] hover:underline flex items-center gap-1"
                >
                  Xaritani to'liq ochish <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <BranchMapAdmin
                branches={branches}
                selectedBranch={selectedBranchOnMap}
                onSelectBranch={setSelectedBranchOnMap}
                onEditBranch={(b) => {
                  setBranchForm({ ...b });
                  setDuplicateWarning(null);
                  setBranchModal({ open: true, mode: "edit", item: b });
                }}
                onToggleStatus={handleToggleBranchStatus}
                onDeleteBranch={(b) =>
                  setDeleteConfirm({ open: true, type: "branch", id: b.id, title: b.name })
                }
              />
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL BRANCH MANAGEMENT ON THE MAP (Requirement 1) */}
        {activeTab === "branches" && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Header / Info Card with Bukhara seed button */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h2 className="text-lg font-black text-white">
                    Xalqaro va Respublika Filiallar Tarmog'i
                  </h2>
                </div>
                <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                  Istalgan shahar, ko'cha yoki davlatda filial qo'shing. Xarita orqali qidiring, nuqtani belgilang, koordinatalarni avtomatik oling va statusini boshqaring.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleSeedBranches}
                  disabled={seedingBranches}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                  title="Buxorodagi 5 ta FoodHub filialini bazaga yuklash"
                >
                  {seedingBranches ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#e63946]" />
                  ) : (
                    <Compass className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Standart Buxoro Filiallarini Yuklash (5 ta)</span>
                </button>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#e63946]" /> Interaktiv Xarita & Qidiruv
                </h3>
                <span className="text-xs text-white/50">
                  Xaritaga bosib yangi nuqta belgilashingiz mumkin
                </span>
              </div>

              <BranchMapAdmin
                branches={branches}
                selectedBranch={selectedBranchOnMap}
                onSelectBranch={setSelectedBranchOnMap}
                onEditBranch={(b) => {
                  setBranchForm({ ...b });
                  setDuplicateWarning(null);
                  setBranchModal({ open: true, mode: "edit", item: b });
                }}
                onToggleStatus={handleToggleBranchStatus}
                onDeleteBranch={(b) =>
                  setDeleteConfirm({ open: true, type: "branch", id: b.id, title: b.name })
                }
                onAddAtCoordinates={(coords) => {
                  setBranchForm({
                    name: `FoodHub ${coords.city || "Yangi filial"}`,
                    country: coords.country || "O'zbekiston",
                    city: coords.city || "Buxoro",
                    address: coords.address || "",
                    latitude: coords.lat,
                    longitude: coords.lng,
                    phone: "+998 ",
                    openingHours: "10:00 — 02:00",
                    isActive: true,
                  });
                  setDuplicateWarning(null);
                  setBranchModal({ open: true, mode: "create", item: null });
                }}
              />
            </div>

            {/* Filters Bar */}
            <div className="bg-[#14100c] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Filial nomi, manzili yoki telefon raqami..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* City Filter */}
                <select
                  value={branchCityFilter}
                  onChange={(e) => setBranchCityFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#e63946]"
                >
                  <option value="all" className="bg-[#14100c]">Barcha shaharlar ({branches.length})</option>
                  {uniqueBranchCities.map((city) => (
                    <option key={city} value={city} className="bg-[#14100c]">
                      {city} ({branches.filter((b) => b.city === city).length})
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={branchStatusFilter}
                  onChange={(e) => setBranchStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#e63946]"
                >
                  <option value="all" className="bg-[#14100c]">Barcha holatlar</option>
                  <option value="active" className="bg-[#14100c]">Faqat Faol ({branches.filter((b) => b.isActive).length})</option>
                  <option value="inactive" className="bg-[#14100c]">Faqat Nofaol ({branches.filter((b) => !b.isActive).length})</option>
                </select>
              </div>
            </div>

            {/* Branches List Table */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              {filteredBranches.length === 0 ? (
                <div className="p-12 text-center text-white/50 text-xs">
                  <MapPin className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  Mos keluvchi filiallar topilmadi. Qidiruv parametrlarini o'zgartiring yoki yangi filial qo'shing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider bg-white/[0.02]">
                        <th className="p-4 font-semibold">Filial Nomi</th>
                        <th className="p-4 font-semibold">Shahar & Manzil</th>
                        <th className="p-4 font-semibold">Koordinatalar</th>
                        <th className="p-4 font-semibold">Aloqa / Ish Vaqti</th>
                        <th className="p-4 font-semibold">Holati</th>
                        <th className="p-4 font-semibold text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredBranches.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  b.isActive ? "bg-emerald-400" : "bg-red-400"
                                }`}
                              />
                              <div>
                                <p className="font-bold text-white text-sm">{b.name}</p>
                                <p className="text-white/40 text-[10px]">{b.country || "O'zbekiston"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-white">{b.city}</p>
                            <p className="text-white/50 text-[11px] line-clamp-1 max-w-xs">{b.address}</p>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-white/60">
                            {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)}
                          </td>
                          <td className="p-4">
                            <p className="text-white font-medium">{b.phone || "—"}</p>
                            <p className="text-white/40 text-[10px]">{b.openingHours || "10:00 — 02:00"}</p>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleBranchStatus(b)}
                              disabled={actionLoadingId === b.id}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${
                                b.isActive
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {actionLoadingId === b.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                              )}
                              {b.isActive ? "Faol" : "Nofaol"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedBranchOnMap(b);
                                  window.scrollTo({ top: 300, behavior: "smooth" });
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition"
                                title="Xaritada ko'rish"
                              >
                                <Crosshair className="w-4 h-4 text-amber-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setBranchForm({ ...b });
                                  setDuplicateWarning(null);
                                  setBranchModal({ open: true, mode: "edit", item: b });
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: "branch",
                                    id: b.id,
                                    title: b.name,
                                  })
                                }
                                className="p-2 hover:bg-red-500/10 rounded-xl text-white/70 hover:text-red-400 transition"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS */}
        {activeTab === "products" && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Filter Bar */}
            <div className="bg-[#14100c] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Taom nomi yoki tavsifi bo'yicha qidirish..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#e63946]"
                >
                  <option value="all" className="bg-[#14100c]">Barcha Kategoriyalar</option>
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug} className="bg-[#14100c]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-white/50 text-xs">
                  Taomlar topilmadi. Qidiruvni tozalang yoki yangi taom qo'shing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider bg-white/[0.02]">
                        <th className="p-4 font-semibold">Taom</th>
                        <th className="p-4 font-semibold">Kategoriya</th>
                        <th className="p-4 font-semibold">Narxi</th>
                        <th className="p-4 font-semibold">Holati</th>
                        <th className="p-4 font-semibold text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-white/5 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-white text-sm">{p.name}</p>
                                <p className="text-white/50 text-[11px] line-clamp-1 max-w-xs">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[11px] text-white/70 uppercase font-semibold">
                              {categories.find((c) => c.slug === p.categoryId)?.name || p.categoryId}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white">
                            {(p.price || 0).toLocaleString()} so'm
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleAvailable(p)}
                              disabled={actionLoadingId === p.id}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${
                                p.isAvailable
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {actionLoadingId === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full ${p.isAvailable ? "bg-emerald-400" : "bg-red-400"}`} />
                              )}
                              {p.isAvailable ? "Mavjud" : "Tugagan"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setProductForm({
                                    name: p.name,
                                    categoryId: p.categoryId,
                                    price: p.price,
                                    description: p.description || "",
                                    imageUrl: p.imageUrl || "",
                                    calories: p.calories || "",
                                    isAvailable: p.isAvailable ?? true,
                                  });
                                  setProductModal({ open: true, mode: "edit", item: p });
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: "product",
                                    id: p.id,
                                    title: p.name,
                                  })
                                }
                                className="p-2 hover:bg-red-500/10 rounded-xl text-white/70 hover:text-red-400 transition"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES */}
        {activeTab === "categories" && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.slug).length;
                return (
                  <div
                    key={c.id || c.slug}
                    className="bg-[#14100c] border border-white/10 rounded-3xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                          #{c.slug}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setCategoryForm({
                                name: c.name,
                                slug: c.slug,
                                description: c.description || "",
                                imageUrl: c.imageUrl || "",
                                displayOrder: c.displayOrder || 1,
                              });
                              setCategoryModal({ open: true, mode: "edit", item: c });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: "category",
                                id: c.id,
                                title: c.name,
                              })
                            }
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-black text-lg text-white">{c.name}</h3>
                      <p className="text-white/60 text-xs mt-1 line-clamp-2">
                        {c.description || "Tavsif berilmagan"}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-white/40">Taomlar soni:</span>
                      <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-full">
                        {count} ta
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS */}
        {activeTab === "orders" && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Order Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buyurtma raqami, mijoz ismi yoki telefon..."
                  className="w-full bg-[#14100c] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-[#e63946]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                {[
                  { id: "all", label: "Hammasi" },
                  { id: "new", label: "Yangi" },
                  { id: "pending", label: "Kutilmoqda" },
                  { id: "preparing", label: "Tayyorlanmoqda" },
                  { id: "delivering", label: "Yetkazilmoqda" },
                  { id: "completed", label: "Tugatilgan" },
                  { id: "cancelled", label: "Bekor qilingan" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      orderStatusFilter === st.id
                        ? "bg-[#e63946] text-white"
                        : "bg-white/5 hover:bg-white/10 text-white/60"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-[#14100c] border border-white/10 rounded-3xl p-12 text-center text-white/50 text-xs">
                  Buyurtmalar mavjud emas
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-[#14100c] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-base text-white">
                            #{o.orderNumber || o.id.slice(-6)}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                              o.status === "new" || o.status === "pending"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : o.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : o.status === "cancelled"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs mt-1">
                          {o.createdAt ? new Date(o.createdAt).toLocaleString("uz-UZ") : "Hozirgina"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={o.status}
                          disabled={actionLoadingId === o.id}
                          onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                          className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#e63946] disabled:opacity-50"
                        >
                          <option value="pending" className="bg-[#14100c]">Kutilmoqda</option>
                          <option value="new" className="bg-[#14100c]">Yangi</option>
                          <option value="preparing" className="bg-[#14100c]">Tayyorlanmoqda</option>
                          <option value="delivering" className="bg-[#14100c]">Yetkazilmoqda</option>
                          <option value="completed" className="bg-[#14100c]">Tugatilgan</option>
                          <option value="cancelled" className="bg-[#14100c]">Bekor qilingan</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 text-white/70">
                        <p>
                          <strong className="text-white">Mijoz:</strong> {o.customerName || "Noma'lum"} (
                          {o.customerPhone || "Raqamsiz"})
                        </p>
                        <p className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#e63946] shrink-0 mt-0.5" />
                          <span>{o.address || "Manzil ko'rsatilmagan"}</span>
                        </p>
                        {o.notes && (
                          <p className="text-amber-300 italic">Izoh: "{o.notes}"</p>
                        )}
                      </div>

                      <div className="text-right flex flex-col justify-between">
                        <div>
                          <p className="text-white/50 text-[11px]">To'lov usuli: {o.payMethod}</p>
                          <p className="text-lg font-black text-white mt-1">
                            {(o.total || 0).toLocaleString()} so'm
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 divide-y divide-white/5 text-xs">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center text-white/80">
                          <span>
                            {it.name} <strong className="text-[#e63946]">x{it.qty}</strong>
                          </span>
                          <span className="font-mono">{((it.price || 0) * (it.qty || 1)).toLocaleString()} so'm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className="p-6 md:p-8 space-y-6 max-w-4xl">
            {/* Database & Seeding Card */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-black text-lg text-white">Boshlang'ich Ma'lumotlarni Yuklash (Seed)</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Agar Firestore ma'lumotlar bazangiz bo'sh bo'lsa, quyidagi tugmalar orqali menyu, kategoriyalar va 5 ta Buxoro filialini bir zumda yuklashingiz mumkin.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleSeedMenu}
                  className="bg-[#e63946] hover:bg-[#ff4d5c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4" /> Boshlang'ich Menyuni Yuklash
                </button>
                <button
                  onClick={handleSeedBranches}
                  disabled={seedingBranches}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  {seedingBranches ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  5 ta Buxoro Filialini Yuklash
                </button>
              </div>
            </div>

            {/* Admin Designation Card */}
            <div className="bg-[#14100c] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-black text-lg text-white">Yangi Admin Biriktirish</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Boshqa foydalanuvchiga to'liq admin boshqaruv huquqini berish uchun uning Firebase UID identifikatorini kiriting.
              </p>
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <input
                  type="text"
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Foydalanuvchi UID..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#e63946]"
                />
                <button
                  type="submit"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                >
                  Tayinlash
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT BRANCH (Requirement 1 & 2) */}
      {branchModal.open && (
        <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14100c] border border-white/15 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-black text-xl text-white">
                  {branchModal.mode === "create" ? "Yangi FoodHub Filialini Qo'shish" : "Filialni Tahrirlash"}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Xaritadagi joylashuv va kontakt ma'lumotlarini to'ldiring
                </p>
              </div>
              <button
                disabled={submittingBranch}
                onClick={() => setBranchModal({ open: false, mode: "create", item: null })}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Duplicate Warning Prompt */}
            {duplicateWarning && (
              <div className="mb-5 p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-200 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold">Diqqat: Takroriy filial ehtimoli!</p>
                  <p className="text-white/80">{duplicateWarning}</p>
                  <p className="text-white/60">
                    Agar haqiqatan ham ushbu filialni qo'shishni istasangiz, "Baribir Saqlash" tugmasini bosing.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Filial Nomi *</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => {
                    setDuplicateWarning(null);
                    setBranchForm({ ...branchForm, name: e.target.value });
                  }}
                  placeholder="masalan: FoodHub Labi Hovuz"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Davlat *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.country}
                    onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                    placeholder="O'zbekiston"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Shahar *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => {
                      setDuplicateWarning(null);
                      setBranchForm({ ...branchForm, city: e.target.value });
                    }}
                    placeholder="Buxoro, Toshkent, Samarqand..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">To'liq Manzil *</label>
                <input
                  type="text"
                  required
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Ko'cha, uy raqami, diqqatga sazovor joy..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              {/* Coordinates Pickers */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Kenglik (Latitude) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={branchForm.latitude}
                    onChange={(e) => {
                      setDuplicateWarning(null);
                      setBranchForm({ ...branchForm, latitude: e.target.value });
                    }}
                    placeholder="39.7747"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#e63946]"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Uzunlik (Longitude) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={branchForm.longitude}
                    onChange={(e) => {
                      setDuplicateWarning(null);
                      setBranchForm({ ...branchForm, longitude: e.target.value });
                    }}
                    placeholder="64.4286"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Telefon Raqami</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+998 65 224 11 01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Ish Vaqti</label>
                  <input
                    type="text"
                    value={branchForm.openingHours}
                    onChange={(e) => setBranchForm({ ...branchForm, openingHours: e.target.value })}
                    placeholder="10:00 — 02:00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="branchIsActive"
                  checked={branchForm.isActive}
                  onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#e63946] rounded"
                />
                <label htmlFor="branchIsActive" className="text-white font-semibold cursor-pointer">
                  Filial faol (Buyurtmalar qabul qiladi va xaritada ko'rinadi)
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  disabled={submittingBranch}
                  onClick={() => setBranchModal({ open: false, mode: "create", item: null })}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingBranch}
                  className="flex-1 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#e63946]/25 disabled:opacity-50"
                >
                  {submittingBranch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Filial saqlanmoqda...
                    </>
                  ) : duplicateWarning ? (
                    "Baribir Saqlash"
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT (Requirement 2) */}
      {productModal.open && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14100c] border border-white/10 rounded-3xl w-full max-w-lg p-6 md:p-8 my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/10">
              <h3 className="font-black text-lg">
                {productModal.mode === "create" ? "Yangi Taom Qo'shish" : "Taomni Tahrirlash"}
              </h3>
              <button
                disabled={submittingProduct}
                onClick={() => setProductModal({ open: false, mode: "create", item: null })}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Taom nomi *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="masalan: Klassik Smash Burger"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Kategoriya *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug} className="bg-[#14100c]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Narxi (so'm) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="89000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Tavsif</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Kotlet, pishloq, maxsus sous..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Rasm (Fayl yoki URL)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#e63946]"
                    />
                    <label className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 font-bold shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageUploading ? "..." : "Fayl"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "products")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {productForm.imageUrl && (
                    <img
                      src={productForm.imageUrl}
                      alt="Oldindan ko'rish"
                      className="w-20 h-20 rounded-xl object-cover border border-white/10 mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">Kaloriya (kcal)</label>
                  <input
                    type="number"
                    value={productForm.calories}
                    onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })}
                    placeholder="650"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={productForm.isAvailable}
                    onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 accent-[#e63946] rounded"
                  />
                  <label htmlFor="isAvailable" className="text-white font-semibold cursor-pointer">
                    Mavjud (Sotuvda bor)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  disabled={submittingProduct}
                  onClick={() => setProductModal({ open: false, mode: "create", item: null })}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex-1 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#e63946]/25 disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Taom saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14100c] border border-white/10 rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <h3 className="font-black text-lg">
                {categoryModal.mode === "create" ? "Yangi Kategoriya" : "Kategoriyani Tahrirlash"}
              </h3>
              <button
                disabled={submittingCategory}
                onClick={() => setCategoryModal({ open: false, mode: "create", item: null })}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Kategoriya Nomi *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="masalan: Burgerlar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Slug (Identifikator)</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="burgers"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Tavsif</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Kategoriya tavsifi..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#e63946]"
                />
              </div>

              <div className="flex gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  disabled={submittingCategory}
                  onClick={() => setCategoryModal({ open: false, mode: "create", item: null })}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex-1 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION (Requirement 2) */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14100c] border border-white/10 rounded-3xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-[#e63946] mx-auto mb-3" />
            <h3 className="font-black text-lg mb-2">O'chirishni Tasdiqlang</h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              Haqiqatan ham <strong className="text-white">"{deleteConfirm.title}"</strong> ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button
                disabled={deletingItem}
                onClick={() => setDeleteConfirm({ open: false, type: "", id: "", title: "" })}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                disabled={deletingItem}
                onClick={handleExecuteDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingItem ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> O'chirilmoqda...
                  </>
                ) : (
                  "O'chirish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
