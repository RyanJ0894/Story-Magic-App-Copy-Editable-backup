# Auth Feature

Authentication feature with modular structure and clear separation of concerns.

## 📁 Structure

```
src/features/auth/
├── components/
│   ├── SignInForm/
│   │   ├── index.tsx             # SignIn form component
│   │   └── schema.ts             # SignIn validation schema
│   ├── SignUpForm/
│   │   ├── index.tsx             # SignUp form component
│   │   └── schema.ts             # SignUp validation schema
│   └── ResetPasswordForm/
│       ├── index.tsx             # Reset password form component
│       └── schema.ts             # Reset password validation schema
├── hooks/
│   └── useAuthPage.ts            # Auth page state management
├── views/
│   ├── SignInView.tsx            # SignIn page view
│   ├── SignUpView.tsx            # SignUp page view
│   └── ResetPasswordView.tsx     # Reset password page view
├── services/
│   └── authApi.ts                # Supabase auth API calls
├── auth.ts                       # Main auth hooks with React Query
├── utils/
│   └── index.ts                  # Auth utility functions
├── auth.type.ts                  # TypeScript interfaces
└── README.md                     # Documentation
```

## 🔧 Usage

### Import Views

```typescript
import { SignInView } from "@/features/auth/views/SignInView";
import { SignUpView } from "@/features/auth/views/SignUpView";
import { ResetPasswordView } from "@/features/auth/views/ResetPasswordView";
```

### Import Components

```typescript
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
```

### Import Hooks

```typescript
import { useAuth, useSignIn, useSignUp, useResetPassword, useUpdatePassword, useSignOut } from "@/features/auth/auth";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
```

### Import Services and Utils

```typescript
import { authApi } from "@/features/auth/services/authApi";
import { getAuthErrorMessage, parseUrlParams } from "@/features/auth/utils";
```

## 🎯 Features

- **Sign In/Up Forms**: Complete forms with validation using react-hook-form + zod
- **Password Reset**: Secure password reset flow with email verification
- **Invitation Support**: Handle team invitation tokens
- **Error Handling**: User-friendly error messages
- **Loading States**: Proper loading indicators
- **Type Safety**: Full TypeScript support

## 🔐 Authentication Flow

1. **Sign In**: Email/password authentication with Supabase
2. **Sign Up**: Account creation with email confirmation
3. **Password Reset**: Email-based password reset flow
4. **Invitations**: Team invitation acceptance flow
5. **Auto Redirect**: Automatic navigation based on auth state

## 🎨 Views and Components

### Views
- **SignInView**: Complete sign-in page with background and layout
- **SignUpView**: Complete sign-up page with invitation support
- **ResetPasswordView**: Complete password reset page

### Form Components
- **SignInForm**: Email and password validation with forgot password
- **SignUpForm**: Account creation form with invitation token support
- **ResetPasswordForm**: New password confirmation with validation

## 🚀 Hooks

### React Query Hooks (auth.ts)
- `useAuth()` - Get current user with automatic polling
- `useSignIn()` - Sign in mutation with loading/error states
- `useSignUp()` - Sign up mutation with loading/error states
- `useResetPassword()` - Reset password mutation
- `useUpdatePassword()` - Update password mutation
- `useSignOut()` - Sign out mutation

### useAuthPage
- Auth page state management
- URL parameter parsing
- Form submission handlers
- Toast notifications and navigation

## 📊 Data Flow

1. **Input**: User credentials from Shadcn forms in dedicated views
2. **Validation**: Individual Zod schemas per form component
3. **API Calls**: React Query mutations using authApi service layer
4. **State Updates**: Automatic cache invalidation and UI updates
5. **Navigation**: Early return pattern with dedicated views

## 🎨 Styling

- Uses Tailwind CSS
- Shadcn UI components
- Cinema theme colors
- Responsive design
- Backdrop blur effects
