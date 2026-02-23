import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

const Auth = () => (
  <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-zinc-100">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">FinanceFlow</h1>
      <p className="text-zinc-500 mb-8">Acesse sua conta para continuar</p>
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Endereço de e-mail',
              password_label: 'Sua senha',
              email_input_placeholder: 'seu.email@exemplo.com',
              password_input_placeholder: 'Sua senha',
              button_label: 'Entrar',
              social_provider_text: 'Entrar com {{provider}}',
              link_text: 'Já tem uma conta? Entre',
            },
            sign_up: {
              email_label: 'Endereço de e-mail',
              password_label: 'Crie uma senha',
              email_input_placeholder: 'seu.email@exemplo.com',
              password_input_placeholder: 'Crie uma senha forte',
              button_label: 'Cadastrar',
              social_provider_text: 'Cadastrar com {{provider}}',
              link_text: 'Não tem uma conta? Cadastre-se',
            },
            forgotten_password: {
              email_label: 'Endereço de e-mail',
              email_input_placeholder: 'seu.email@exemplo.com',
              button_label: 'Enviar instruções',
              link_text: 'Esqueceu sua senha?',
            },
            update_password: {
              password_label: 'Nova senha',
              password_input_placeholder: 'Sua nova senha',
              button_label: 'Atualizar senha',
            },
          },
        }}
      />
    </div>
  </div>
);

export default Auth;
