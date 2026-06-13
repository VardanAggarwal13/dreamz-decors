import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import AnnouncementBar from '@/components/common/AnnouncementBar';
import { AuthBootstrap, PublicOnlyRoute, RequireAuth, RequireAdmin } from '@/components/common/RouteGuards';

// Admin dashboard is code-split — it never ships in the public bundle, keeping
// LCP fast for shoppers and crawlers (Core Web Vitals).
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers'));
const AdminNewsletter = lazy(() => import('@/pages/admin/AdminNewsletter'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'));
import { NotificationBootstrap } from '@/components/common/NotificationBootstrap';
import { WishlistSync } from '@/components/common/WishlistSync';
import { SettingsBootstrap } from '@/components/common/SettingsBootstrap';
import AuthPromptModal from '@/components/common/AuthPromptModal';
import PushOptInModal from '@/components/common/PushOptInModal';
import AccountLayout from '@/components/common/AccountLayout';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Account from '@/pages/Account';
import AccountAddresses from '@/pages/AccountAddresses';
import AccountProfile from '@/pages/AccountProfile';
import AccountNotifications from '@/pages/AccountNotifications';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Wishlist from '@/pages/Wishlist';
import ContentPage from '@/pages/ContentPage';
import NotFound from '@/pages/NotFound';

/* ── Layout used by every route that has a navbar + footer ── */
function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bone text-ink">
      <AnnouncementBar />
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Bootstraps auth state on every page */}
      <AuthBootstrap />
      {/* Connects the real-time notification socket when logged in */}
      <NotificationBootstrap />
      {/* Syncs the wishlist with the user account on login/logout */}
      <WishlistSync />
      {/* Loads store-wide settings (CMS) */}
      <SettingsBootstrap />
      {/* Login prompt for gated actions (e.g. wishlist) */}
      <AuthPromptModal />
      {/* First-visit prompt (per user) to enable browser push notifications */}
      <PushOptInModal />
      {/* Global toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(247 243 236)',
            color: 'rgb(22 22 22)',
            border: '1px solid rgba(197, 158, 89, 0.3)',
          },
        }}
      />

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-bone">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-gold-deep" />
          </div>
        }
      >
      <Routes>
        {/* ── Auth pages — completely bare (no navbar, no footer) ── */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Admin dashboard — separate chrome, admin-only ── */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="content" element={<AdminContent />} />
        </Route>

        {/* ── All other pages — inside the main layout ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/order-success/:orderId"
            element={
              <RequireAuth>
                <OrderSuccess />
              </RequireAuth>
            }
          />
          <Route
            path="/wishlist"
            element={
              <RequireAuth>
                <Wishlist />
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Account />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>
          <Route path="/about" element={<ContentPage pageKey="about" />} />
          <Route path="/shipping" element={<ContentPage pageKey="shipping" />} />
          <Route path="/faq" element={<ContentPage pageKey="faq" />} />
          <Route path="/contact" element={<ContentPage pageKey="contact" />} />
          <Route path="/terms" element={<ContentPage pageKey="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  );
}
