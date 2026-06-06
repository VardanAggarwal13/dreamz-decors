import { Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import AnnouncementBar from '@/components/common/AnnouncementBar';
import { AuthBootstrap, PublicOnlyRoute, RequireAuth } from '@/components/common/RouteGuards';
import { NotificationBootstrap } from '@/components/common/NotificationBootstrap';
import { WishlistSync } from '@/components/common/WishlistSync';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Account from '@/pages/Account';
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

        {/* ── All other pages — inside the main layout ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="/account/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/account/orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route path="/about" element={<ContentPage pageKey="about" />} />
          <Route path="/shipping" element={<ContentPage pageKey="shipping" />} />
          <Route path="/faq" element={<ContentPage pageKey="faq" />} />
          <Route path="/contact" element={<ContentPage pageKey="contact" />} />
          <Route path="/terms" element={<ContentPage pageKey="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
