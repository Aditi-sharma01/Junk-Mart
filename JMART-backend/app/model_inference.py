import torch
from torchvision import models, transforms
from PIL import Image

# List your class names in the same order as your training set
class_names = ['glass', 'metal', 'organic', 'paper', 'plastic']

def load_model():
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))
    model.load_state_dict(torch.load('JMART-backend/app/waste_classifier.pth', map_location='cpu'))
    model.eval()
    return model

model = load_model()

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def predict_image(image_path):
    img = Image.open(image_path).convert('RGB')
    img_t = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        output = model(img_t)
        _, pred = torch.max(output, 1)
    return class_names[pred.item()]