'use client'
import { createEmployeeAction } from "@/app/actions";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function CreateEmployeeForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createEmployeeAction(formData);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => window.location.reload(), 2000); // Refresh to update table
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (<form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Entrez le nom de l'employé"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Entrez l'email de l'employé"
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Entrez le numéro de téléphone"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Entrez le mot de passe"
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirmez le mot de passe"
          required
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? "Création en cours..." : "Créer l'employé"}
      </Button>
    </form>)
}