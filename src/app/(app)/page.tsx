import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  const user = session!.user;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Hoş geldiniz, {user.name}</CardTitle>
        <CardDescription>
          Veli, öğrenci ve kayıt (kreş/etüt) yönetimi için üstteki menüyü
          kullanabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Şube (Tenant):</span>{" "}
          {user.tenantSlug}
        </p>
        <p>
          <span className="text-muted-foreground">Rol:</span>{" "}
          {ROLE_LABELS[user.role]}
        </p>
        <p>
          <span className="text-muted-foreground">E-posta:</span> {user.email}
        </p>
      </CardContent>
    </Card>
  );
}
