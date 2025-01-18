import os

def merge_files(output_file, start_directory=None, file_extensions=None, exclude_dirs=None):
    """
    Rassemble le contenu de tous les fichiers du répertoire spécifié et ses sous-répertoires dans un fichier unique,
    tout en excluant les fichiers dont le nom se termine par '1' suivi de leur extension (ex: '1.js') et les dossiers spécifiés.

    :param output_file: Nom du fichier de sortie contenant le contenu fusionné.
    :param start_directory: Chemin du répertoire de départ pour l'exploration.
    :param file_extensions: Liste des extensions des fichiers à inclure (ex: ['.html', '.css', '.js']).
    :param exclude_dirs: Liste des noms de dossiers à exclure (ex: ['.idea', '.venv']).
    """
    # Utiliser le répertoire spécifié ou le répertoire courant
    if start_directory is None:
        start_directory = os.getcwd()

    print(f"Répertoire de départ : {start_directory}")

    if file_extensions is None:
        file_extensions = ['.html', '.css', '.js']  # Extensions à inclure par défaut

    if exclude_dirs is None:
        exclude_dirs = ['.idea', '.venv', 'python','.git','old']  # Dossiers exclus par défaut

    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(start_directory):
            # Exclure les dossiers spécifiés
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            print(f"Exploration du dossier : {root}")

            for file in files:
                # Vérifie si le fichier est à inclure par extension
                if any(file.endswith(ext) for ext in file_extensions):
                    # Vérifie que le fichier ne se termine pas par '1' suivi de son extension
                    name_without_extension, extension = os.path.splitext(file)
                    if not name_without_extension.endswith("2"):
                        file_path = os.path.join(root, file)
                        print(f"Inclusion du fichier : {file_path}")
                        outfile.write(f"\n\n# --- Début du fichier : {file_path} --- #\n\n")
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                        outfile.write(f"\n\n# --- Fin du fichier : {file_path} --- #\n")

    print(f"Fusion terminée. Contenu enregistré dans : {output_file}")

# Exemple d'utilisation : Précisez le chemin de départ ici
merge_files(output_file="code.txt", start_directory="C:\\Users\\alano\\WebstormProjects\\Croquis3")
