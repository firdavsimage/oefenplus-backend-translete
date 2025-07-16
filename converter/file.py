import os
import shutil

def convert_file(input_path, output_dir):
    # Bu yerda haqiqiy converter bo'lishi kerak
    filename = os.path.basename(input_path)
    output_path = os.path.join(output_dir, filename)
    try:
        shutil.copy(input_path, output_path)  # demo: faqat nusxa ko‘chiradi
        return output_path, filename
    except Exception as e:
        print("Xatolik:", e)
        return None, None
